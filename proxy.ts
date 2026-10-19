import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, signInPathFor } from "@/lib/auth/constants";

// Fast gate: no session cookie, no private page. Pages still verify the
// session and role against the database (lib/auth requireRole).
export function proxy(req: NextRequest) {
  if (req.cookies.has(SESSION_COOKIE)) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  const url = new URL(signInPathFor(pathname), req.url);
  url.searchParams.set("next", pathname + search);
  return NextResponse.redirect(url);
}

export const config = {
  matcher: ["/admin/:path*", "/retailers/portal/:path*", "/affiliates/portal/:path*"],
};
