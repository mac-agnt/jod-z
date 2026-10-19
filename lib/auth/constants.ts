// Shared with proxy.ts, so no server-only imports here.

/** __Host- prefix pins the cookie to this origin over HTTPS (production only). */
export const SESSION_COOKIE = process.env.NODE_ENV === "production" ? "__Host-jz_session" : "jz_session";

export const SESSION_DAYS = 30;
export const LOGIN_TOKEN_MINUTES = 15;

/** Sign-in page for each protected area. */
export const signInPathFor = (path: string) =>
  path.startsWith("/retailers/portal") ? "/retailers" : path.startsWith("/affiliates/portal") ? "/affiliates" : "/sign-in";

/**
 * Only same-site paths are allowed as post-login redirects. Parsed the way a
 * browser would, so tricks like "/\tevil.com" or "/\\evil.com" that a URL
 * parser turns into another host fall back.
 */
export function safeNext(next: unknown, fallback: string): string {
  if (typeof next !== "string" || !next.startsWith("/")) return fallback;
  try {
    const base = "http://same.invalid";
    const u = new URL(next, base);
    if (u.origin !== base) return fallback;
    return `${u.pathname}${u.search}${u.hash}`;
  } catch {
    return fallback;
  }
}
