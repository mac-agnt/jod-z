import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { and, eq } from "drizzle-orm";

const { startCheckout, getAvailability } = await import("@/lib/commerce");
const { db, schema, closeDb } = await import("@/lib/db");

beforeAll(async () => {
  await db().insert(schema.inventory).values([
    { product: "the-jod-z", colour: "admiral-navy", size: "S", available: 5, provider: "demo" },
    { product: "the-jod-z", colour: "admiral-navy", size: "M", available: 0, provider: "demo" },
  ]).onConflictDoNothing();
});
afterAll(closeDb);

describe("demo checkout", () => {
  it("records the order at server prices and takes stock", async () => {
    const r = await startCheckout([{ product: "the-jod-z", colour: "admiral-navy", size: "S", pairs: 2, qty: 1 }], { utmSource: "instagram", code: "ROSIE10" });
    expect(r.ok).toBe(true);
    const id = r.ok ? r.url.split("/").pop()! : "";
    const [order] = await db().select().from(schema.orders).where(eq(schema.orders.id, id));
    expect(order).toMatchObject({ subtotal: 109, discountTotal: 10.9, total: 98.1, utmSource: "instagram", discountCodes: ["ROSIE10"], isDemo: true });
    const lines = await db().select().from(schema.orderLines).where(eq(schema.orderLines.orderId, id));
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatchObject({ quantity: 2, total: 109 });
    const [inv] = await db().select().from(schema.inventory).where(and(eq(schema.inventory.colour, "admiral-navy"), eq(schema.inventory.size, "S")));
    expect(inv.available).toBe(3);
  });

  it("rejects tampered lines", async () => {
    const r = await startCheckout([{ product: "the-jod-z", colour: "admiral-navy", size: "S", pairs: 7, qty: 1 }], {});
    expect(r).toEqual({ ok: false, error: expect.stringContaining("no longer available") });
  });

  it("rejects an empty bag", async () => {
    expect((await startCheckout([], {})).ok).toBe(false);
  });

  it("reports stock from inventory", async () => {
    const a = await getAvailability("the-jod-z");
    expect(a["admiral-navy"].M).toEqual({ available: false, quantity: 0 });
    expect(a["admiral-navy"].S.available).toBe(true);
  });
});
