import "server-only";
import { eq, or, sql } from "drizzle-orm";
import type { SessionUser } from "../auth";
import { db, schema } from "../db";

type Ambassador = typeof schema.ambassadors.$inferSelect;

export async function ambassadorFor(user: SessionUser): Promise<Ambassador | undefined> {
  const [a] = await db().select().from(schema.ambassadors).where(or(eq(schema.ambassadors.userId, user.id), eq(schema.ambassadors.email, user.email))).limit(1);
  return a;
}

/** Orders that used this ambassador's code. No customer details leave the server. */
export async function codeOrders(code: string) {
  const rows = await db().execute(sql`
    select placed_at "placedAt", greatest(subtotal - discount_total - refunded_total, 0)::float8 value, status
    from orders where channel = 'web' and status in ('paid', 'partially_refunded') and ${code} = any(discount_codes)
    order by placed_at desc limit 200`) as unknown as { placedAt: string; value: number; status: string }[];
  const since = Date.now() - 30 * 86_400_000;
  const recent = rows.filter((r) => new Date(r.placedAt).getTime() > since);
  const sum = (xs: typeof rows) => xs.reduce((n, r) => n + r.value, 0);
  return { rows: rows.slice(0, 20), all: { orders: rows.length, revenue: sum(rows) }, last30: { orders: recent.length, revenue: sum(recent) } };
}
