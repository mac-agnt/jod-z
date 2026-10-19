import "server-only";
import { and, eq, sql } from "drizzle-orm";
import { commerceMode } from "../env";
import { db, hasDatabase, schema } from "../db";
import { getProduct } from "../products";
import { checkLine, normSize, shopifyHandles, type CheckedLine, type LineInput } from "../catalog";
import { shortCode } from "../crypto";
import { createCart, variantsByHandle } from "../shopify/storefront";
import { cartPermalink, publicProducts } from "../shopify/public";
import type { Attribution, Availability, CheckoutResult } from "./types";

const clean = (v: unknown, max = 120) => (typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined);

/** Attribution as Shopify cart attributes. Leading underscore hides them from the shopper. */
function cartAttributes(a: Attribution): Record<string, string> {
  const out: Record<string, string> = {};
  const set = (k: string, v: unknown) => { const c = clean(v, 200); if (c) out[k] = c; };
  set("_utm_source", a.utmSource);
  set("_utm_medium", a.utmMedium);
  set("_utm_campaign", a.utmCampaign);
  set("_landing", a.landing);
  set("_referrer", a.referrer);
  return out;
}

const codeOf = (a: Attribution) => clean(a.code, 40)?.toUpperCase().replace(/[^A-Z0-9-]/g, "");

export async function getAvailability(productSlug: string): Promise<Availability> {
  const p = getProduct(productSlug);
  if (!p) return {};
  const handles = shopifyHandles[p.slug] ?? {};
  const mode = commerceMode();
  const out: Availability = {};

  try {
    if (mode === "shopify") {
      const byHandle = await variantsByHandle(Object.values(handles));
      for (const [colour, h] of Object.entries(handles)) {
        for (const v of byHandle[h] ?? []) {
          const size = p.sizes.find((s) => normSize(s) === normSize(v.selectedOptions[0]?.value ?? ""));
          if (size) (out[colour] ??= {})[size] = { available: v.availableForSale, quantity: v.quantityAvailable ?? undefined };
        }
      }
    } else if (mode === "permalink") {
      const byHandle = await publicProducts();
      for (const [colour, h] of Object.entries(handles)) {
        for (const v of byHandle[h] ?? []) {
          const size = p.sizes.find((s) => normSize(s) === normSize(v.option1 ?? v.title));
          if (size) (out[colour] ??= {})[size] = { available: v.available };
        }
      }
    } else if (mode === "demo" && hasDatabase()) {
      const rows = await db().select().from(schema.inventory).where(eq(schema.inventory.product, p.slug));
      for (const r of rows) (out[r.colour] ??= {})[r.size] = { available: r.available > 0, quantity: r.available };
    }
  } catch (e) {
    // Stock lookup failing must never block selling: show everything as available
    // and let Shopify checkout enforce stock.
    console.error("availability lookup failed", e);
    return {};
  }
  return out;
}

export async function startCheckout(raw: LineInput[], attribution: Attribution): Promise<CheckoutResult> {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > 30) return { ok: false, error: "Your bag is empty." };
  const lines = raw.map(checkLine);
  if (lines.some((l) => !l)) return { ok: false, error: "Something in your bag is no longer available. Remove it and try again." };
  const checked = lines as CheckedLine[];
  const mode = commerceMode();
  const attrs = cartAttributes(attribution);
  const code = codeOf(attribution);

  try {
    if (mode === "shopify") {
      const handles = [...new Set(checked.map((l) => shopifyHandles[l.product][l.colour]))];
      const byHandle = await variantsByHandle(handles, 0);
      const sfLines = checked.map((l) => {
        const v = byHandle[shopifyHandles[l.product][l.colour]]?.find((x) => normSize(x.selectedOptions[0]?.value ?? "") === normSize(l.size));
        if (!v) throw new Error(`No Shopify variant for ${l.title}`);
        return { merchandiseId: v.id, quantity: l.units, attributes: l.pairs > 1 ? [{ key: "Pack", value: `${l.pairs} pairs` }] : undefined };
      });
      const url = await createCart({ lines: sfLines, attributes: Object.entries(attrs).map(([key, value]) => ({ key, value })), discountCodes: code ? [code] : [] });
      return { ok: true, url };
    }

    if (mode === "permalink") {
      const byHandle = await publicProducts();
      const items = checked.map((l) => {
        const v = byHandle[shopifyHandles[l.product][l.colour]]?.find((x) => normSize(x.option1 ?? x.title) === normSize(l.size));
        if (!v) throw new Error(`No Shopify variant for ${l.title}`);
        return { variantId: v.id, quantity: l.units };
      });
      return { ok: true, url: cartPermalink(items, attrs, code) };
    }

    if (mode === "demo") return { ok: true, url: `/checkout/demo/${await createDemoOrder(checked, attribution, code)}` };
  } catch (e) {
    console.error("checkout failed", e);
    return { ok: false, error: "Checkout is unavailable right now. Please try again in a minute." };
  }
  return { ok: false, error: "Online checkout opens soon. Email hello@jod-z.com to order." };
}

/** Local stand-in for Shopify checkout: records an order so the dashboard has real flows to show. */
async function createDemoOrder(lines: CheckedLine[], a: Attribution, code?: string): Promise<string> {
  const subtotal = lines.reduce((n, l) => n + l.total, 0);
  const discount = code ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
  const total = subtotal - discount;
  return db().transaction(async (tx) => {
    const [order] = await tx.insert(schema.orders).values({
      channel: "web",
      provider: "demo",
      externalId: shortCode(10),
      number: `DEMO-${shortCode(5)}`,
      country: "IE",
      subtotal,
      discountTotal: discount,
      total,
      discountCodes: code ? [code] : [],
      utmSource: clean(a.utmSource),
      utmMedium: clean(a.utmMedium),
      utmCampaign: clean(a.utmCampaign),
      isDemo: true,
    }).returning({ id: schema.orders.id });
    await tx.insert(schema.orderLines).values(lines.map((l) => ({
      orderId: order.id, product: l.product, colour: l.colour, size: l.size, title: l.title, quantity: l.units, unitPrice: l.unitPrice / l.pairs, total: l.total,
    })));
    for (const l of lines) {
      await tx.update(schema.inventory).set({ available: sql`greatest(${schema.inventory.available} - ${l.units}, 0)`, updatedAt: new Date() })
        .where(and(eq(schema.inventory.product, l.product), eq(schema.inventory.colour, l.colour), eq(schema.inventory.size, l.size)));
    }
    return order.id;
  });
}
