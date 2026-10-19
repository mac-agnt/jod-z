import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createHmac } from "node:crypto";
import { eq } from "drizzle-orm";
import { NextRequest } from "next/server";

process.env.SHOPIFY_WEBHOOK_SECRET = "whsec_test";
process.env.SHOPIFY_STORE_DOMAIN = "jodz-test.myshopify.com";
delete process.env.SHOPIFY_ADMIN_TOKEN;

const { POST } = await import("@/app/api/webhooks/shopify/route");
const { db, schema, closeDb } = await import("@/lib/db");

afterAll(closeDb);
beforeEach(() => {
  // Product id -> handle comes from the public catalogue when there is no Admin token.
  vi.stubGlobal("fetch", vi.fn(async () => Response.json({ products: [{ id: 11, handle: "merry-berry" }, { id: 22, handle: "the-eclipse-breech-black" }] })));
});
afterEach(() => vi.unstubAllGlobals());

const order = (over: Record<string, unknown> = {}) => ({
  id: 5550001, name: "#2041", email: "Parent@Example.com", created_at: "2026-10-10T10:00:00+01:00", currency: "EUR", financial_status: "paid",
  subtotal_price: "177.00", total_discounts: "17.70", total_tax: "0.00", total_price: "159.30", total_shipping_price_set: { shop_money: { amount: "0.00" } },
  discount_codes: [{ code: "rosie10" }], note_attributes: [{ name: "_utm_source", value: "facebook" }, { name: "_utm_campaign", value: "autumn" }],
  shipping_address: { country_code: "IE" }, customer: { id: 9, orders_count: 1 },
  line_items: [
    { product_id: 11, title: "Merry Berry", variant_title: "M", quantity: 2, price: "59.00" },
    { product_id: 22, title: "The Eclipse Breech (Black)", variant_title: "28”", quantity: 1, price: "59.00" },
  ],
  ...over,
});

function req(body: object, topic = "orders/create", id = `wh-${Math.random()}`, secret = "whsec_test") {
  const raw = JSON.stringify(body);
  return new NextRequest("http://localhost/api/webhooks/shopify", {
    method: "POST",
    body: raw,
    headers: { "x-shopify-hmac-sha256": createHmac("sha256", secret).update(raw).digest("base64"), "x-shopify-topic": topic, "x-shopify-webhook-id": id },
  });
}

describe("Shopify order webhook", () => {
  it("rejects a bad signature", async () => {
    expect((await POST(req(order(), "orders/create", "x", "wrong"))).status).toBe(401);
  });

  it("stores the order with lines mapped to this site's catalogue", async () => {
    const res = await POST(req(order()));
    expect(res.status).toBe(200);
    const [o] = await db().select().from(schema.orders).where(eq(schema.orders.externalId, "5550001"));
    expect(o).toMatchObject({ number: "#2041", total: 159.3, discountTotal: 17.7, discountCodes: ["ROSIE10"], utmSource: "facebook", utmCampaign: "autumn", country: "IE", isFirstOrder: true, status: "paid" });
    expect(o.customerHash).not.toContain("example");
    const lines = await db().select().from(schema.orderLines).where(eq(schema.orderLines.orderId, o.id));
    expect(lines.map((l) => [l.product, l.colour, l.size, l.quantity]).sort()).toEqual([["jockey-breech", "eclipse-black", '28"', 1], ["the-jod-z", "merry-berry", "M", 2]]);
  });

  it("ignores a repeated delivery", async () => {
    const id = "wh-repeat";
    await POST(req(order({ id: 5550002, name: "#2042" }), "orders/create", id));
    const again = await (await POST(req(order({ id: 5550002, name: "#2042" }), "orders/create", id))).json();
    expect(again.duplicate).toBe(true);
  });

  it("updates refunds in place without duplicating", async () => {
    await POST(req(order({ id: 5550003, name: "#2043" })));
    await POST(req(order({ id: 5550003, name: "#2043", financial_status: "partially_refunded", refunds: [{ transactions: [{ kind: "refund", status: "success", amount: "59.00" }, { kind: "refund", status: "failure", amount: "100.00" }] }] }), "orders/updated"));
    const rows = await db().select().from(schema.orders).where(eq(schema.orders.externalId, "5550003"));
    expect(rows).toHaveLength(1);
    expect(rows[0]).toMatchObject({ status: "partially_refunded", refundedTotal: 59 });
    expect(await db().select().from(schema.orderLines).where(eq(schema.orderLines.orderId, rows[0].id))).toHaveLength(2);
  });

  it("ignores a stale update that arrives after a newer one", async () => {
    await POST(req(order({ id: 5550004, name: "#2044", updated_at: "2026-10-10T12:00:00+01:00", cancelled_at: "2026-10-10T12:00:00+01:00" }), "orders/cancelled"));
    await POST(req(order({ id: 5550004, name: "#2044", updated_at: "2026-10-10T10:30:00+01:00" }), "orders/updated"));
    const [o] = await db().select().from(schema.orders).where(eq(schema.orders.externalId, "5550004"));
    expect(o.status).toBe("cancelled");
  });
});
