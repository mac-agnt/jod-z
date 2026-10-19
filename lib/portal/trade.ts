import "server-only";
import { and, desc, eq, inArray, or, sql } from "drizzle-orm";
import type { SessionUser } from "../auth";
import { db, schema } from "../db";
import { products } from "../products";
import { tradeRules, tradeSale, type TradeItem, type TradeOrder } from "../trade";

type Retailer = typeof schema.retailers.$inferSelect;

export async function retailerFor(user: SessionUser): Promise<Retailer | undefined> {
  const [r] = await db().select().from(schema.retailers).where(or(eq(schema.retailers.userId, user.id), eq(schema.retailers.email, user.email))).limit(1);
  return r;
}

/** The trade catalogue for one stockist: their discount, live stock. */
export async function catalogueFor(r: Retailer): Promise<TradeItem[]> {
  const stock = await db().select({ product: schema.inventory.product, colour: schema.inventory.colour, total: sql<number>`sum(${schema.inventory.available})::int` })
    .from(schema.inventory).groupBy(schema.inventory.product, schema.inventory.colour);
  const left = new Map(stock.map((s) => [`${s.product}:${s.colour}`, s.total]));
  return products.flatMap((p) => p.colourways.map((c) => {
    const id = `${p.slug}:${c.slug}`;
    const units = left.get(id);
    return {
      id, product: p.slug, colour: c.slug, name: p.kind === "legging" ? "Jod-Z Legging" : p.name, colourName: c.name, image: c.image, hex: c.hex, kind: p.kind,
      rrp: p.price,
      trade: Math.round(p.price * (1 - r.tradeDiscountPct / 100) * 100) / 100,
      sale: tradeSale[id],
      stock: units === undefined ? "In stock" : units === 0 ? "Out of stock" : units < tradeRules.caseSize * 2 ? "Low stock" : "In stock",
    } satisfies TradeItem;
  }));
}

export async function ordersFor(retailerId: string): Promise<TradeOrder[]> {
  const rows = await db().select().from(schema.orders)
    .where(and(eq(schema.orders.channel, "wholesale"), eq(schema.orders.retailerId, retailerId))).orderBy(desc(schema.orders.placedAt)).limit(20);
  if (!rows.length) return [];
  const lines = await db().select().from(schema.orderLines).where(inArray(schema.orderLines.orderId, rows.map((o) => o.id)));
  return rows.map((o) => ({
    id: o.id,
    ref: o.number,
    date: o.placedAt.toISOString(),
    status: o.wholesaleStatus ?? "submitted",
    total: o.total,
    lines: lines.filter((l) => l.orderId === o.id && l.product && l.colour).map((l) => ({ id: `${l.product}:${l.colour}`, cases: Math.max(1, Math.round(l.quantity / tradeRules.caseSize)) })),
  }));
}

/** Pairs moved across every channel in the last 90 days, with the change on the 90 before. */
export async function bestsellers(limit = 6) {
  const rows = await db().execute(sql`
    select l.product || ':' || l.colour id,
      coalesce(sum(l.quantity) filter (where o.placed_at > now() - interval '90 days'), 0)::int units,
      coalesce(sum(l.quantity) filter (where o.placed_at <= now() - interval '90 days'), 0)::int prev
    from order_lines l join orders o on o.id = l.order_id
    where o.status <> 'cancelled' and o.placed_at > now() - interval '180 days' and l.product is not null and l.colour is not null
    group by 1 order by units desc limit ${limit}`) as unknown as { id: string; units: number; prev: number }[];
  return rows.filter((r) => r.units > 0).map((r) => ({ id: r.id, units: r.units, trend: r.prev ? (r.units - r.prev) / r.prev : null }));
}
