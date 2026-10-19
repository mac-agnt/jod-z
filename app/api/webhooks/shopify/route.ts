import { NextResponse, type NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { env } from "@/lib/env";
import { hmac, safeEqual } from "@/lib/crypto";
import { productHandles } from "@/lib/sync";
import { upsertShopifyOrder, type ShopifyOrder } from "@/lib/sync/shopify-orders";

// Shopify order webhooks: orders/create, orders/updated, orders/paid,
// orders/cancelled. Verified with the app's HMAC secret and de-duplicated
// on the webhook id, so retries are harmless.

const ORDER_TOPICS = new Set(["orders/create", "orders/updated", "orders/paid", "orders/cancelled", "orders/fulfilled"]);

export async function POST(req: NextRequest) {
  if (!env.SHOPIFY_WEBHOOK_SECRET) return NextResponse.json({ error: "Webhooks not configured" }, { status: 503 });
  const raw = await req.text();
  const sig = req.headers.get("x-shopify-hmac-sha256") ?? "";
  if (!sig || !safeEqual(hmac(env.SHOPIFY_WEBHOOK_SECRET, raw, "base64"), sig)) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });

  const topic = req.headers.get("x-shopify-topic") ?? "";
  const id = req.headers.get("x-shopify-webhook-id") ?? `${topic}:${req.headers.get("x-shopify-event-id") ?? Date.now()}`;
  const [seen] = await db().select({ id: schema.webhookEvents.id }).from(schema.webhookEvents).where(eq(schema.webhookEvents.id, id)).limit(1);
  if (seen) return NextResponse.json({ ok: true, duplicate: true });

  if (ORDER_TOPICS.has(topic)) {
    try {
      // The upsert is idempotent, so a retry racing this delivery is harmless.
      await upsertShopifyOrder(JSON.parse(raw) as ShopifyOrder, await productHandles());
    } catch (e) {
      console.error("shopify webhook failed", topic, e);
      return NextResponse.json({ error: "Processing failed" }, { status: 500 });
    }
  }
  // Only remembered once handled, so a crash mid-way leaves Shopify free to retry.
  await db().insert(schema.webhookEvents).values({ id, topic }).onConflictDoNothing();
  return NextResponse.json({ ok: true });
}
