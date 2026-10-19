import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { db, hasDatabase, schema } from "@/lib/db";
import { authSecret } from "@/lib/env";
import { hmac } from "@/lib/crypto";
import { deviceFrom, isBot } from "@/lib/request";
import { rateLimit } from "@/lib/rate-limit";

// First-party, cookieless analytics. The visitor id is a salted hash of IP
// and user agent that rotates every day, so it counts unique visitors for
// one day without storing anything on the device or any personal data.

const short = z.string().trim().max(200).optional();
const Event = z.object({
  name: z.enum(["page_view", "view_item", "select_colour", "add_to_cart", "begin_checkout", "sign_up", "apply_ambassador", "apply_retailer", "contact"]),
  path: z.string().max(300).optional(),
  product: z.string().max(60).optional(),
  colour: z.string().max(60).optional(),
  size: z.string().max(10).optional(),
  pairs: z.number().int().min(1).max(10).optional(),
  value: z.number().min(0).max(10000).optional(),
  utmSource: short,
  utmMedium: short,
  utmCampaign: short,
  referrer: short,
});

const noContent = () => new NextResponse(null, { status: 204 });

export async function POST(req: NextRequest) {
  const ua = req.headers.get("user-agent") ?? "";
  if (!hasDatabase() || isBot(ua)) return noContent();
  // Browsers send Origin on POST: drop events posted from other sites.
  const origin = req.headers.get("origin");
  if (origin && new URL(origin).host !== req.headers.get("host")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  const parsed = Event.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "0.0.0.0";
  if (!(await rateLimit(`t:${ip}`, 300, 600))) return noContent();

  const day = new Date().toISOString().slice(0, 10);
  const e = parsed.data;
  await db().insert(schema.analyticsEvents).values({
    name: e.name,
    path: e.path,
    visitorId: hmac(authSecret(), `${day}|${ip}|${ua}`).slice(0, 32),
    referrer: e.referrer,
    utmSource: e.utmSource,
    utmMedium: e.utmMedium,
    utmCampaign: e.utmCampaign,
    country: req.headers.get("x-vercel-ip-country"),
    device: deviceFrom(ua),
    product: e.product,
    colour: e.colour,
    value: e.value,
  });
  return noContent();
}
