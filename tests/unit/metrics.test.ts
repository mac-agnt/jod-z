import { afterAll, beforeAll, describe, expect, it } from "vitest";

const { db, schema, closeDb } = await import("@/lib/db");
const m = await import("@/lib/metrics");
const { getRange, addDays, dublinDate } = await import("@/lib/metrics/range");

afterAll(closeDb);

const today = dublinDate();
const at = (daysAgo: number) => new Date(`${addDays(today, -daysAgo)}T12:00:00Z`);

beforeAll(async () => {
  // Country ZZ isolates these rows from orders other test files create.
  const rows = await db().insert(schema.orders).values([
    { channel: "web", provider: "demo", externalId: "m1", number: "M1", country: "ZZ", subtotal: 100, total: 100, placedAt: at(1), utmSource: "zz-src" },
    { channel: "web", provider: "demo", externalId: "m2", number: "M2", country: "ZZ", subtotal: 200, total: 200, refundedTotal: 50, status: "partially_refunded", placedAt: at(2), utmSource: "zz-src" },
    { channel: "web", provider: "demo", externalId: "m3", number: "M3", country: "ZZ", subtotal: 999, total: 999, status: "cancelled", placedAt: at(2) },
    { channel: "web", provider: "demo", externalId: "m4", number: "M4", country: "ZZ", subtotal: 70, total: 70, placedAt: at(40) },
    { channel: "wholesale", provider: "portal", number: "W1", country: "ZZ", subtotal: 500, total: 615, placedAt: at(1) },
  ]).returning({ id: schema.orders.id });
  await db().insert(schema.adInsights).values([
    { date: addDays(today, -1), level: "campaign", entityId: "zz-c", entityName: "ZZ", spend: 40, impressions: 10000, clicks: 150, purchases: 2, purchaseValue: 180 },
    { date: addDays(today, -1), level: "ad", entityId: "zz-a", entityName: "ZZ ad", spend: 40, impressions: 10000, clicks: 150, purchases: 2, purchaseValue: 180 },
  ]);
  void rows;
});

describe("ranges", () => {
  it("covers N days inclusive, with an equal previous period", () => {
    const r = getRange("7");
    expect(r.end).toBe(today);
    expect(addDays(r.start, 6)).toBe(r.end);
    expect(addDays(r.prevEnd, 1)).toBe(r.start);
    expect(getRange("nonsense").days).toBe(30);
  });
});

describe("sales metrics", () => {
  it("nets refunds, skips cancelled and wholesale orders, and respects the range", async () => {
    const r = getRange("30");
    const zz = (await m.salesByOrder("country", r.start, r.end)).find((x) => x.key === "ZZ")!;
    expect(zz).toMatchObject({ orders: 2, revenue: 250 });
    const src = (await m.salesByOrder("source", r.start, r.end)).find((x) => x.key === "zz-src")!;
    expect(src.revenue).toBe(250);
  });

  it("fills every day in the series", async () => {
    const r = getRange("7");
    const s = await m.revenueByDay(r);
    expect(s).toHaveLength(7);
    expect(s.every((p) => typeof p.value === "number")).toBe(true);
  });
});

describe("ad metrics", () => {
  it("counts campaign rows only and derives ratios", async () => {
    const r = getRange("7");
    const k = await m.adsKpis(r.start, r.end);
    expect(k.spend).toBeGreaterThanOrEqual(40);
    expect(k.ctr).toBeGreaterThan(0);
    const ads = await m.adsTable("ad", r.start, r.end);
    expect(ads.find((a) => a.id === "zz-a")).toMatchObject({ spend: 40, value: 180 });
  });
});
