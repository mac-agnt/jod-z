import "server-only";
import { headers } from "next/headers";

/** Caller details from the incoming request (server actions, route handlers, pages). */
export async function requestInfo() {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "0.0.0.0";
  return {
    ip,
    userAgent: h.get("user-agent") ?? "",
    country: h.get("x-vercel-ip-country") ?? null,
  };
}

export const deviceFrom = (ua: string) => (/mobile|iphone|android(?!.*tablet)/i.test(ua) ? "mobile" : /ipad|tablet/i.test(ua) ? "tablet" : "desktop");

export const isBot = (ua: string) => !ua || /bot|crawler|spider|slurp|facebookexternalhit|preview|headless|lighthouse|pingdom|uptime/i.test(ua);
