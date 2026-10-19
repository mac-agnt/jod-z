import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db, schema } from "../db";
import { env, isProd } from "../env";
import { randomToken, sha256 } from "../crypto";
import { siteUrl } from "../site";
import { rateLimit } from "../rate-limit";
import { sendEmail, showDevLinks } from "../email/send";
import { templates } from "../email/templates";
import type { Role } from "../db/schema";
import { LOGIN_TOKEN_MINUTES, SESSION_COOKIE, SESSION_DAYS, safeNext, signInPathFor } from "./constants";

export type SessionUser = { id: string; email: string; name: string | null; role: Role };

export const normaliseEmail = (e: string) => e.trim().toLowerCase();

const homeFor = (role: Role) => (role === "admin" ? "/admin" : role === "retailer" ? "/retailers/portal" : "/affiliates/portal");

/** Who this email is allowed to sign in as, if anyone. Admin wins. */
async function resolveRole(email: string): Promise<{ role: Role; name: string | null } | null> {
  if (env.ADMIN_EMAILS.includes(email)) return { role: "admin", name: null };
  const [r] = await db().select({ name: schema.retailers.contactName }).from(schema.retailers)
    .where(and(eq(schema.retailers.email, email), eq(schema.retailers.status, "approved"))).limit(1);
  if (r) return { role: "retailer", name: r.name };
  const [a] = await db().select({ name: schema.ambassadors.name }).from(schema.ambassadors)
    .where(and(eq(schema.ambassadors.email, email), eq(schema.ambassadors.status, "approved"))).limit(1);
  if (a) return { role: "ambassador", name: a.name };
  return null;
}

export type SignInRequest = { ok: boolean; error?: string; devUrl?: string };

/**
 * Emails a one-time sign-in link. Responds the same way whether or not the
 * email has an account, so the form cannot be used to discover accounts.
 */
export async function requestSignIn(rawEmail: string, next: string, ip: string): Promise<SignInRequest> {
  const email = normaliseEmail(rawEmail);
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, error: "Enter a valid email address." };
  if (!(await rateLimit(`signin:ip:${ip}`, 20, 900))) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };

  const who = await resolveRole(email);
  if (!who) return { ok: true };
  // Counted only for real accounts, so strangers cannot lock someone out by guessing.
  if (!(await rateLimit(`signin:email:${email}`, 8, 900))) return { ok: false, error: "Too many attempts. Try again in 15 minutes." };

  const token = randomToken();
  await db().insert(schema.loginTokens).values({
    email,
    tokenHash: sha256(token),
    next: safeNext(next, homeFor(who.role)),
    expiresAt: new Date(Date.now() + LOGIN_TOKEN_MINUTES * 60_000),
  });
  const url = `${siteUrl()}/auth/verify?token=${token}`;
  const sent = await sendEmail(email, "sign-in", templates.signIn(url));
  if (!sent.ok) return { ok: false, error: "We could not send the email. Try again shortly." };
  return { ok: true, devUrl: showDevLinks() ? url : undefined };
}

/** Spends a sign-in token and starts a session. Returns where to go next. */
export async function consumeSignIn(token: string, userAgent: string): Promise<string | null> {
  const [t] = await db().update(schema.loginTokens).set({ usedAt: new Date() })
    .where(and(eq(schema.loginTokens.tokenHash, sha256(token)), isNull(schema.loginTokens.usedAt), gt(schema.loginTokens.expiresAt, new Date())))
    .returning();
  if (!t) return null;

  // Re-check: access may have been withdrawn since the link was sent.
  const who = await resolveRole(t.email);
  if (!who) return null;

  const [user] = await db().insert(schema.users).values({ email: t.email, role: who.role, name: who.name, lastLoginAt: new Date() })
    .onConflictDoUpdate({ target: schema.users.email, set: { role: who.role, lastLoginAt: new Date() } })
    .returning();
  if (who.role === "retailer") await db().update(schema.retailers).set({ userId: user.id }).where(eq(schema.retailers.email, t.email));
  if (who.role === "ambassador") await db().update(schema.ambassadors).set({ userId: user.id }).where(eq(schema.ambassadors.email, t.email));

  const secret = randomToken();
  await db().insert(schema.sessions).values({
    id: sha256(secret),
    userId: user.id,
    expiresAt: new Date(Date.now() + SESSION_DAYS * 86_400_000),
    userAgent: userAgent.slice(0, 300),
  });
  (await cookies()).set(SESSION_COOKIE, secret, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_DAYS * 86_400,
  });
  return safeNext(t.next, homeFor(who.role));
}

/** Is this role still granted? Checked on every request, so removing access takes effect at once. */
async function stillAllowed(u: SessionUser): Promise<boolean> {
  if (u.role === "admin") return env.ADMIN_EMAILS.includes(u.email);
  if (u.role === "retailer") {
    const [r] = await db().select({ s: schema.retailers.status }).from(schema.retailers).where(eq(schema.retailers.email, u.email)).limit(1);
    return r?.s === "approved";
  }
  const [a] = await db().select({ s: schema.ambassadors.status }).from(schema.ambassadors).where(eq(schema.ambassadors.email, u.email)).limit(1);
  // Paused ambassadors can still see their portal and its paused notice.
  return a?.s === "approved" || a?.s === "paused";
}

/** The signed-in user for this request, or null. Cached per request. */
export const getSession = cache(async (): Promise<SessionUser | null> => {
  const secret = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!secret) return null;
  const [row] = await db()
    .select({ id: schema.users.id, email: schema.users.email, name: schema.users.name, role: schema.users.role })
    .from(schema.sessions)
    .innerJoin(schema.users, eq(schema.sessions.userId, schema.users.id))
    .where(and(eq(schema.sessions.id, sha256(secret)), gt(schema.sessions.expiresAt, new Date())))
    .limit(1);
  if (!row) return null;
  if (!(await stillAllowed(row))) {
    await db().delete(schema.sessions).where(eq(schema.sessions.userId, row.id));
    return null;
  }
  return row;
});

/** Guard for pages and actions. Admins can open every area. */
export async function requireRole(roles: Role[], here: string): Promise<SessionUser> {
  const user = await getSession();
  if (!user || (!roles.includes(user.role) && user.role !== "admin")) {
    redirect(`${signInPathFor(here)}?next=${encodeURIComponent(here)}${user ? "&denied=1" : ""}`);
  }
  return user;
}

export async function endSession() {
  const jar = await cookies();
  const secret = jar.get(SESSION_COOKIE)?.value;
  if (secret) await db().delete(schema.sessions).where(eq(schema.sessions.id, sha256(secret)));
  jar.delete(SESSION_COOKIE);
}
