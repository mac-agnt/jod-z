import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => undefined, set: () => {}, delete: () => {} }), headers: async () => new Headers() }));

const { safeNext } = await import("@/lib/auth/constants");
const { requestSignIn } = await import("@/lib/auth");
const { rateLimit } = await import("@/lib/rate-limit");
const { db, schema, closeDb } = await import("@/lib/db");

afterAll(closeDb);

describe("safeNext", () => {
  it("allows same-site paths", () => expect(safeNext("/admin/sales?r=30", "/x")).toBe("/admin/sales?r=30"));
  it.each(["//evil.com", "https://evil.com", "/\\evil.com", "/\t/evil.com", "/\n/evil.com", "/\\\\evil.com", "admin", undefined, 42])("rejects %j", (v) => expect(safeNext(v, "/x")).toBe("/x"));
  it("keeps query and hash", () => expect(safeNext("/retailers/portal?x=1#orders", "/x")).toBe("/retailers/portal?x=1#orders"));
});

describe("rateLimit", () => {
  it("blocks after the limit within the window", async () => {
    const key = `t:${Math.random()}`;
    const results = [];
    for (let i = 0; i < 4; i++) results.push(await rateLimit(key, 3, 60));
    expect(results).toEqual([true, true, true, false]);
  });
});

describe("requestSignIn", () => {
  it("rejects malformed email", async () => {
    expect((await requestSignIn("nope", "/admin", "1.1.1.1")).ok).toBe(false);
  });

  it("answers the same for unknown emails without creating a token", async () => {
    const r = await requestSignIn("stranger@example.com", "/admin", "1.1.1.2");
    expect(r).toEqual({ ok: true });
    const rows = await db().select().from(schema.loginTokens).where(eq(schema.loginTokens.email, "stranger@example.com"));
    expect(rows).toHaveLength(0);
  });

  it("creates a hashed, expiring token for admins and returns a dev link", async () => {
    const r = await requestSignIn(" Admin@Jod-Z.test ", "/admin/sales", "1.1.1.3");
    expect(r.ok).toBe(true);
    expect(r.devUrl).toMatch(/\/auth\/verify\?token=[\w-]{40,}/);
    const token = new URL(r.devUrl!).searchParams.get("token")!;
    const [row] = await db().select().from(schema.loginTokens).where(eq(schema.loginTokens.email, "admin@jod-z.test"));
    expect(row.tokenHash).not.toContain(token);
    expect(row.next).toBe("/admin/sales");
    expect(row.expiresAt.getTime()).toBeGreaterThan(Date.now());
  });

  it("only lets approved retailers sign in", async () => {
    await db().insert(schema.retailers).values({ storeName: "Tack Shop", contactName: "Aoife Byrne", email: "shop@tack.test", status: "applied" });
    expect((await requestSignIn("shop@tack.test", "/", "1.1.1.4")).devUrl).toBeUndefined();
    await db().update(schema.retailers).set({ status: "approved" }).where(eq(schema.retailers.email, "shop@tack.test"));
    expect((await requestSignIn("shop@tack.test", "/", "1.1.1.4")).devUrl).toBeDefined();
  });

  it("rate limits repeated links for a real account, but never for unknown emails", async () => {
    await db().insert(schema.retailers).values({ storeName: "Rate Shop", contactName: "Rita Lane", email: "rl@tack.test", status: "approved" });
    const real = [];
    for (let i = 0; i < 9; i++) real.push((await requestSignIn("rl@tack.test", "/", `2.2.2.${i}`)).ok);
    expect(real.slice(0, 8).every(Boolean)).toBe(true);
    expect(real[8]).toBe(false);
    const unknown = [];
    for (let i = 0; i < 10; i++) unknown.push((await requestSignIn("ghost@example.com", "/", `3.3.3.${i}`)).ok);
    expect(unknown.every(Boolean)).toBe(true);
  });
});
