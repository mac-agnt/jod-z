import { afterAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";

const { ambassadorSchema, contactSchema, retailerSchema, subscribeSchema, fieldErrors } = await import("@/lib/forms/schemas");
const svc = await import("@/lib/forms/service");
const { db, schema, closeDb } = await import("@/lib/db");

afterAll(closeDb);
const tokenFrom = (url?: string) => new URL(url!).searchParams.get("token")!;

describe("schemas", () => {
  it("needs the age confirmation to subscribe", () => {
    const r = subscribeSchema.safeParse({ email: "a@b.ie" });
    expect(r.success).toBe(false);
    expect(fieldErrors(r.error!).age).toMatch(/confirm/);
  });
  it("requires a guardian for under-16 ambassadors, and a different email", () => {
    const base = { name: "Saoirse Kelly", email: "saoirse@kid.ie", ageGroup: "under16", terms: "on" };
    expect(fieldErrors(ambassadorSchema.safeParse(base).error!)).toMatchObject({ guardianName: expect.any(String), guardianEmail: expect.any(String) });
    expect(fieldErrors(ambassadorSchema.safeParse({ ...base, guardianName: "Niamh Kelly", guardianEmail: "SAOIRSE@kid.ie" }).error!).guardianEmail).toMatch(/own email/);
    expect(ambassadorSchema.safeParse({ ...base, guardianName: "Niamh Kelly", guardianEmail: "niamh@parent.ie" }).success).toBe(true);
  });
  it("normalises handles and emails", () => {
    const v = ambassadorSchema.parse({ name: "Ella Byrne", email: " Ella@Rider.IE ", handle: "ellarides", ageGroup: "16plus", terms: "on" });
    expect(v).toMatchObject({ email: "ella@rider.ie", handle: "@ellarides" });
  });
  it("validates retailer and contact forms", () => {
    expect(retailerSchema.safeParse({ storeName: "X", contactName: "A", email: "bad" }).success).toBe(false);
    expect(contactSchema.safeParse({ name: "Ann Lee", email: "ann@x.ie", topic: "Sizing help", message: "short" }).success).toBe(false);
  });
});

describe("newsletter double opt-in (no Klaviyo)", () => {
  it("stores a pending subscriber and confirms once", async () => {
    const r = await svc.subscribe(subscribeSchema.parse({ email: "fan@rider.ie", age: "on", source: "footer" }));
    const [row] = await db().select().from(schema.subscribers).where(eq(schema.subscribers.email, "fan@rider.ie"));
    expect(row).toMatchObject({ status: "pending", ageConfirmed: true, source: "footer" });
    expect(await svc.confirmSubscription(tokenFrom(r.devUrl))).toBe(true);
    expect(await svc.confirmSubscription(tokenFrom(r.devUrl))).toBe(false);
    const [after] = await db().select().from(schema.subscribers).where(eq(schema.subscribers.email, "fan@rider.ie"));
    expect(after.status).toBe("subscribed");
    expect((await svc.subscribe(subscribeSchema.parse({ email: "fan@rider.ie", age: "on" }))).message).toMatch(/on the list/);
  });
});

describe("ambassador applications", () => {
  it("holds under-16 applications until a guardian agrees", async () => {
    const r = await svc.applyAmbassador(ambassadorSchema.parse({ name: "Saoirse Kelly", email: "saoirse@kid.ie", ageGroup: "under16", guardianName: "Niamh Kelly", guardianEmail: "niamh@parent.ie", terms: "on" }));
    expect(r.message).toMatch(/Niamh Kelly/);
    let [a] = await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.email, "saoirse@kid.ie"));
    expect(a.status).toBe("awaiting_guardian");
    expect(await svc.guardianConsent("wrong-token")).toBeNull();
    expect(await svc.guardianConsent(tokenFrom(r.devUrl))).toBe("Saoirse Kelly");
    [a] = await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.email, "saoirse@kid.ie"));
    expect(a.status).toBe("applied");
    expect(a.guardianConsentAt).toBeInstanceOf(Date);
  });
  it("accepts 16+ directly and does not duplicate", async () => {
    const v = ambassadorSchema.parse({ name: "Ella Byrne", email: "ella@rider.ie", ageGroup: "16plus", terms: "on" });
    await svc.applyAmbassador(v);
    // Second try gets the same kind of answer as a first application (no account discovery).
    expect((await svc.applyAmbassador(v)).message).toMatch(/We review every application/);
    const rows = await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.email, "ella@rider.ie"));
    expect(rows).toHaveLength(1);
    expect(rows[0].status).toBe("applied");
  });
});

describe("retailer and contact", () => {
  it("records a stockist application", async () => {
    await svc.applyRetailer(retailerSchema.parse({ storeName: "Bridle Path Saddlery", contactName: "Conor Walsh", email: "conor@bridlepath.ie", storeType: "Saddlery or tack shop", town: "Naas", country: "Ireland", consent: "on" }));
    const [r] = await db().select().from(schema.retailers).where(eq(schema.retailers.email, "conor@bridlepath.ie"));
    expect(r).toMatchObject({ status: "applied", town: "Naas" });
  });
  it("stores a contact message and emails a receipt", async () => {
    await svc.sendContact(contactSchema.parse({ name: "Ann Lee", email: "ann@x.ie", topic: "Sizing help", message: "My daughter is 11 and tall, which size?" }));
    const [m] = await db().select().from(schema.contactMessages).where(eq(schema.contactMessages.email, "ann@x.ie"));
    expect(m.status).toBe("new");
    const log = await db().select().from(schema.emailLog).where(eq(schema.emailLog.to, "ann@x.ie"));
    expect(log[0]).toMatchObject({ template: "contact-receipt", status: "logged" });
  });
});
