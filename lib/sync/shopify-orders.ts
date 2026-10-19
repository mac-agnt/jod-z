import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { authSecret } from "../env";
import { hmac } from "../crypto";
import { fromShopifyHandle, normSize } from "../catalog";
import { getProduct } from "../products";
import type { OrderStatus } from "../db/schema";

// Shopify REST order JSON (webhooks and /orders.json share this shape).
export type ShopifyOrder = {
  id: number;
  name: string;
  email?: string | null;
  created_at: string;
  updated_at?: string;
  cancelled_at?: string | null;
  currency: string;
  financial_status?: string | null;
  subtotal_price: string;
  total_discounts: string;
  total_tax: string;
  total_price: string;
  total_shipping_price_set?: { shop_money: { amount: string } };
  discount_codes?: { code: string }[];
  note_attributes?: { name: string; value: string }[];
  shipping_address?: { country_code?: string } | null;
  billing_address?: { country_code?: string } | null;
  customer?: { id?: number; orders_count?: number } | null;
  refunds?: { transactions?: { kind: string; status: string; amount: string }[] }[];
  line_items: { product_id: number | null; title: string; variant_title: string | null; quantity: number; price: string; total_discount?: string }[];
};

const num = (s?: string | null) => Math.round(Number(s ?? 0) * 100) / 100;

function statusOf(o: ShopifyOrder): OrderStatus {
  if (o.cancelled_at) return "cancelled";
  switch (o.financial_status) {
    case "refunded": return "refunded";
    case "partially_refunded": return "partially_refunded";
    case "pending": case "authorized": return "pending";
    case "voided": return "cancelled";
    default: return "paid";
  }
}

/**
 * Upserts a Shopify order into the local store. productHandles maps Shopify
 * product ids to handles so lines resolve to this site's product + colour.
 */
export async function upsertShopifyOrder(o: ShopifyOrder, productHandles: Map<number, string>) {
  const attrs = Object.fromEntries((o.note_attributes ?? []).map((a) => [a.name, a.value]));
  const refunded = (o.refunds ?? []).flatMap((r) => r.transactions ?? []).filter((t) => t.kind === "refund" && t.status === "success").reduce((s, t) => s + num(t.amount), 0);
  // Hash, never store, the customer's email: enough for new vs returning.
  const customerHash = o.email ? hmac(authSecret(), o.email.trim().toLowerCase()).slice(0, 32) : o.customer?.id ? `c${o.customer.id}` : null;

  let isFirstOrder: boolean | null = o.customer?.orders_count != null ? o.customer.orders_count <= 1 : null;
  if (isFirstOrder === null && customerHash) {
    const [prior] = await db().select({ n: sql<number>`count(*)::int` }).from(schema.orders)
      .where(and(eq(schema.orders.customerHash, customerHash), sql`placed_at < ${new Date(o.created_at)}`));
    isFirstOrder = prior.n === 0;
  }

  const values = {
    channel: "web" as const,
    provider: "shopify" as const,
    externalId: String(o.id),
    number: o.name,
    customerHash,
    country: o.shipping_address?.country_code ?? o.billing_address?.country_code ?? null,
    currency: o.currency,
    subtotal: num(o.subtotal_price),
    discountTotal: num(o.total_discounts),
    shippingTotal: num(o.total_shipping_price_set?.shop_money.amount),
    taxTotal: num(o.total_tax),
    total: num(o.total_price),
    refundedTotal: Math.round(refunded * 100) / 100,
    discountCodes: (o.discount_codes ?? []).map((d) => d.code.toUpperCase()),
    status: statusOf(o),
    utmSource: attrs._utm_source ?? null,
    utmMedium: attrs._utm_medium ?? null,
    utmCampaign: attrs._utm_campaign ?? null,
    isFirstOrder,
    placedAt: new Date(o.created_at),
    updatedAt: new Date(o.updated_at ?? o.created_at),
  };

  await db().transaction(async (tx) => {
    // Shopify can deliver webhooks out of order: never let an older snapshot overwrite a newer one.
    const [row] = await tx.insert(schema.orders).values(values)
      .onConflictDoUpdate({
        target: [schema.orders.provider, schema.orders.externalId],
        set: { ...values, isFirstOrder: sql`coalesce(${schema.orders.isFirstOrder}, excluded.is_first_order)` },
        setWhere: sql`excluded.updated_at >= ${schema.orders.updatedAt}`,
      })
      .returning({ id: schema.orders.id });
    if (!row) return;
    await tx.delete(schema.orderLines).where(eq(schema.orderLines.orderId, row.id));
    if (o.line_items.length) {
      await tx.insert(schema.orderLines).values(o.line_items.map((l) => {
        const handle = l.product_id ? productHandles.get(l.product_id) : undefined;
        const ref = handle ? fromShopifyHandle(handle) : null;
        const p = ref ? getProduct(ref.product) : undefined;
        const size = p?.sizes.find((s) => normSize(s) === normSize(l.variant_title ?? "")) ?? l.variant_title;
        const unit = num(l.price);
        return { orderId: row.id, product: ref?.product ?? null, colour: ref?.colour ?? null, size, title: [l.title, l.variant_title].filter(Boolean).join(", "), quantity: l.quantity, unitPrice: unit, total: Math.round((unit * l.quantity - num(l.total_discount)) * 100) / 100 };
      }));
    }
  });
}
