import { afterAll, describe, expect, it, vi } from "vitest";
import { eq } from "drizzle-orm";

// A cookie jar the auth module reads through next/headers.
const jar = new Map<string, string>();
vi.mock("next/headers", () => ({
  cookies: async () => ({ get: (k: string) => (jar.has(k) ? { value: jar.get(k) } : undefined), set: (k: string, v: string) => jar.set(k, v), delete: (k: string) => jar.delete(k) }),
  headers: async () => new Headers(),
}));

const { getSession } = await import("@/lib/auth");
const { SESSION_COOKIE } = await import("@/lib/auth/constants");
const { sha256 } = await import("@/lib/crypto");
const { db, schema, closeDb } = await import("@/lib/db");

afterAll(closeDb);

async function sessionFor(email: string, role: "retailer" | "admin") {
  const [u] = await db().insert(schema.users).values({ email, role }).onConflictDoUpdate({ target: schema.users.email, set: { role } }).returning();
  const secret = `secret-${Math.random()}`;
  await db().insert(schema.sessions).values({ id: sha256(secret), userId: u.id, expiresAt: new Date(Date.now() + 86_400_000) });
  jar.set(SESSION_COOKIE, secret);
  return u;
}

describe("session revocation", () => {
  it("ends a stockist's session as soon as they are paused", async () => {
    await db().insert(schema.retailers).values({ storeName: "Paused Tack", contactName: "Pat Ryan", email: "paused@tack.test", status: "approved" });
    await sessionFor("paused@tack.test", "retailer");
    expect((await getSession())?.email).toBe("paused@tack.test");
    await db().update(schema.retailers).set({ status: "paused" }).where(eq(schema.retailers.email, "paused@tack.test"));
    // getSession is cached per request; a new request is a fresh import scope in practice, so call the uncached path.
    vi.resetModules();
    const fresh = await import("@/lib/auth");
    expect(await fresh.getSession()).toBeNull();
  });

  it("ends an admin's session when they leave ADMIN_EMAILS", async () => {
    await sessionFor("former@jod-z.test", "admin");
    vi.resetModules();
    const fresh = await import("@/lib/auth");
    expect(await fresh.getSession()).toBeNull();
    const left = await db().select().from(schema.sessions).innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id)).where(eq(schema.users.email, "former@jod-z.test"));
    expect(left).toHaveLength(0);
  });
});
