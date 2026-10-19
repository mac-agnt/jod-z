import "server-only";
import { and, desc, eq, lt, sql } from "drizzle-orm";
import { db, schema } from "../db";
import { env, integrations } from "../env";
import { fromShopifyHandle, normSize } from "../catalog";
import { getProduct } from "../products";
import { restAll } from "../shopify/admin";
import { klaviyo } from "../klaviyo";
import { purgeStale } from "../forms/service";
import { upsertShopifyOrder, type ShopifyOrder } from "./shopify-orders";
import { addDays, dublinDate } from "../metrics/range";

type Outcome = { records: number; message?: string };
type Source = "shopify" | "meta" | "klaviyo" | "housekeeping";

async function run(source: Source, fn: () => Promise<Outcome>) {
  const [r] = await db().insert(schema.syncRuns).values({ source }).returning({ id: schema.syncRuns.id });
  try {
    const out = await fn();
    await db().update(schema.syncRuns).set({ finishedAt: new Date(), ok: true, records: out.records, message: out.message }).where(eq(schema.syncRuns.id, r.id));
    return { source, ok: true, ...out };
  } catch (e) {
    const message = e instanceof Error ? e.message : String(e);
    console.error(`sync ${source} failed`, e);
    await db().update(schema.syncRuns).set({ finishedAt: new Date(), ok: false, message: message.slice(0, 500) }).where(eq(schema.syncRuns.id, r.id));
    return { source, ok: false, records: 0, message };
  }
}

/** Runs every configured sync. Unconfigured sources are skipped, not failed. */
export async function runSync(only?: Source[]) {
  const on = integrations();
  const want = (s: Source) => !only || only.includes(s);
  const results = [];
  if (want("shopify") && on.shopifyAdmin) results.push(await run("shopify", syncShopify));
  if (want("meta") && on.meta) results.push(await run("meta", () => syncMeta(30)));
  if (want("klaviyo") && on.klaviyo) results.push(await run("klaviyo", syncKlaviyo));
  if (want("housekeeping")) results.push(await run("housekeeping", housekeeping));
  return results;
}

// Shopify

type RestProduct = { id: number; handle: string; variants: { id: number; option1: string | null; title: string; inventory_quantity?: number }[] };
let handleCache: { at: number; map: Map<number, string> } | null = null;

/** Shopify product id to handle, from the Admin API or, without a token, the public catalogue. */
export async function productHandles(): Promise<Map<number, string>> {
  if (handleCache && Date.now() - handleCache.at < 600_000) return handleCache.map;
  let list: { id: number; handle: string }[];
  if (env.SHOPIFY_ADMIN_TOKEN) list = await restAll<RestProduct>("/products.json?fields=id,handle&limit=250", "products");
  else {
    const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/products.json?limit=250`, { cache: "no-store" });
    list = ((await res.json()) as { products: { id: number; handle: string }[] }).products;
  }
  handleCache = { at: Date.now(), map: new Map(list.map((p) => [p.id, p.handle])) };
  return handleCache.map;
}

async function syncShopify(): Promise<Outcome> {
  const products = await restAll<RestProduct>("/products.json?fields=id,handle,variants&limit=250", "products");
  handleCache = { at: Date.now(), map: new Map(products.map((p) => [p.id, p.handle])) };
  let stock = 0;
  for (const p of products) {
    const ref = fromShopifyHandle(p.handle);
    const prod = ref && getProduct(ref.product);
    if (!ref || !prod) continue;
    for (const v of p.variants) {
      const size = prod.sizes.find((s) => normSize(s) === normSize(v.option1 ?? v.title));
      if (!size || v.inventory_quantity == null) continue;
      await db().insert(schema.inventory).values({ product: ref.product, colour: ref.colour, size, available: Math.max(0, v.inventory_quantity), provider: "shopify" })
        .onConflictDoUpdate({ target: [schema.inventory.product, schema.inventory.colour, schema.inventory.size], set: { available: Math.max(0, v.inventory_quantity), provider: "shopify", updatedAt: new Date() } });
      stock++;
    }
  }

  // Orders changed since the last good run (with a day of overlap), or the last 180 days on the first run.
  const [last] = await db().select({ at: schema.syncRuns.startedAt }).from(schema.syncRuns)
    .where(and(eq(schema.syncRuns.source, "shopify"), eq(schema.syncRuns.ok, true))).orderBy(desc(schema.syncRuns.startedAt)).limit(1);
  const since = new Date((last?.at.getTime() ?? Date.now() - 180 * 86_400_000) - 86_400_000);
  const orders = await restAll<ShopifyOrder>(`/orders.json?status=any&limit=250&updated_at_min=${since.toISOString()}`, "orders");
  for (const o of orders) await upsertShopifyOrder(o, handleCache.map);
  return { records: orders.length + stock, message: `${orders.length} orders, ${stock} stock levels` };
}

// Meta

type MetaAction = { action_type: string; value: string };
type MetaRow = { date_start: string; campaign_id: string; campaign_name: string; ad_id?: string; ad_name?: string; spend: string; impressions: string; clicks: string; actions?: MetaAction[]; action_values?: MetaAction[] };

const PURCHASE = ["omni_purchase", "purchase", "offsite_conversion.fb_pixel_purchase"];
const pickAction = (a?: MetaAction[]) => {
  for (const t of PURCHASE) { const hit = a?.find((x) => x.action_type === t); if (hit) return Number(hit.value); }
  return 0;
};

async function metaGet<T>(path: string, params: Record<string, string>): Promise<T[]> {
  const out: T[] = [];
  const u = new URL(`https://graph.facebook.com/${env.META_GRAPH_VERSION}/${path}`);
  for (const [k, v] of Object.entries(params)) u.searchParams.set(k, v);
  u.searchParams.set("access_token", env.META_ACCESS_TOKEN!);
  let next: string | null = u.toString();
  for (let i = 0; next && i < 50; i++) {
    const res: Response = await fetch(next, { cache: "no-store", signal: AbortSignal.timeout(30000) });
    const json = (await res.json()) as { data?: T[]; paging?: { next?: string }; error?: { message: string } };
    if (!res.ok || json.error) throw new Error(`Meta: ${json.error?.message ?? `HTTP ${res.status}`}`);
    out.push(...(json.data ?? []));
    next = json.paging?.next ?? null;
  }
  return out;
}

/** Daily campaign and ad insights. Meta revises attribution for up to 28 days, so re-pull a month. */
export async function syncMeta(days: number): Promise<Outcome> {
  const act = env.META_AD_ACCOUNT_ID!.replace(/^act_/, "");
  const until = dublinDate();
  const since = addDays(until, -(days - 1));
  const common = { time_increment: "1", time_range: JSON.stringify({ since, until }), limit: "500" };
  const fields = "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values";
  const [campaigns, ads, creatives] = await Promise.all([
    metaGet<MetaRow>(`act_${act}/insights`, { ...common, level: "campaign", fields }),
    metaGet<MetaRow>(`act_${act}/insights`, { ...common, level: "ad", fields: `${fields},ad_id,ad_name` }),
    metaGet<{ id: string; creative?: { thumbnail_url?: string } }>(`act_${act}/ads`, { fields: "id,creative{thumbnail_url}", limit: "200" }),
  ]);
  const thumbs = new Map(creatives.map((c) => [c.id, c.creative?.thumbnail_url ?? null]));
  const rows = [
    ...campaigns.map((r) => ({ level: "campaign" as const, entityId: r.campaign_id, entityName: r.campaign_name, thumbnailUrl: null, r })),
    ...ads.map((r) => ({ level: "ad" as const, entityId: r.ad_id!, entityName: r.ad_name ?? r.ad_id!, thumbnailUrl: thumbs.get(r.ad_id!) ?? null, r })),
  ];
  for (const { level, entityId, entityName, thumbnailUrl, r } of rows) {
    const v = { date: r.date_start, level, entityId, entityName, campaignId: r.campaign_id, campaignName: r.campaign_name, thumbnailUrl, spend: Number(r.spend), impressions: Number(r.impressions), clicks: Number(r.clicks), purchases: pickAction(r.actions), purchaseValue: pickAction(r.action_values), isDemo: false };
    await db().insert(schema.adInsights).values(v).onConflictDoUpdate({ target: [schema.adInsights.date, schema.adInsights.level, schema.adInsights.entityId], set: v });
  }
  return { records: rows.length, message: `${campaigns.length} campaign-days, ${ads.length} ad-days` };
}

// Klaviyo

type Report = { data: { attributes: { results: { groupings: Record<string, string>; statistics: Record<string, number> }[] } } };
const STATS = ["recipients", "opens_unique", "clicks_unique", "conversions", "conversion_value"];

async function syncKlaviyo(): Promise<Outcome> {
  const list = await klaviyo<{ data: { attributes: { profile_count?: number } } }>(`/lists/${env.KLAVIYO_LIST_ID}?additional-fields[list]=profile_count`);
  const size = list.data.attributes.profile_count ?? 0;
  await db().insert(schema.listSnapshots).values({ date: dublinDate(), listSize: size }).onConflictDoUpdate({ target: schema.listSnapshots.date, set: { listSize: size, isDemo: false } });

  const metrics = await klaviyo<{ data: { id: string; attributes: { name: string } }[] }>(`/metrics?filter=equals(name,"Placed Order")`);
  const metricId = metrics.data[0]?.id;
  let n = 1;
  if (metricId) {
    const camps = await klaviyo<{ data: { id: string; attributes: { name: string; send_time: string | null } }[] }>(`/campaigns?filter=equals(messages.channel,'email')`);
    const names = new Map(camps.data.map((c) => [c.id, c.attributes]));
    const report = await klaviyo<Report>("/campaign-values-reports", { method: "POST", body: { data: { type: "campaign-values-report", attributes: { statistics: STATS, timeframe: { key: "last_365_days" }, conversion_metric_id: metricId } } } });
    for (const r of report.data.attributes.results) {
      const id = r.groupings.campaign_id;
      const meta = names.get(id);
      const v = { id, name: meta?.name ?? id, sentAt: meta?.send_time ? new Date(meta.send_time) : null, recipients: r.statistics.recipients ?? 0, opens: r.statistics.opens_unique ?? 0, clicks: r.statistics.clicks_unique ?? 0, conversions: r.statistics.conversions ?? 0, revenue: r.statistics.conversion_value ?? 0, kind: "campaign" as const, isDemo: false };
      await db().insert(schema.emailCampaigns).values(v).onConflictDoUpdate({ target: schema.emailCampaigns.id, set: v });
      n++;
    }
    const flows = await klaviyo<{ data: { id: string; attributes: { name: string } }[] }>("/flows");
    const flowNames = new Map(flows.data.map((f) => [f.id, f.attributes.name]));
    const flowReport = await klaviyo<Report>("/flow-values-reports", { method: "POST", body: { data: { type: "flow-values-report", attributes: { statistics: STATS, timeframe: { key: "last_365_days" }, conversion_metric_id: metricId } } } });
    const byFlow = new Map<string, Record<string, number>>();
    for (const r of flowReport.data.attributes.results) {
      const acc = byFlow.get(r.groupings.flow_id) ?? {};
      for (const k of STATS) acc[k] = (acc[k] ?? 0) + (r.statistics[k] ?? 0);
      byFlow.set(r.groupings.flow_id, acc);
    }
    for (const [id, s] of byFlow) {
      const v = { id: `flow-${id}`, name: flowNames.get(id) ?? id, recipients: s.recipients, opens: s.opens_unique, clicks: s.clicks_unique, conversions: s.conversions, revenue: s.conversion_value, kind: "flow" as const, isDemo: false };
      await db().insert(schema.emailCampaigns).values(v).onConflictDoUpdate({ target: schema.emailCampaigns.id, set: v });
      n++;
    }
  }
  return { records: n, message: `list ${size}${metricId ? "" : ", no Placed Order metric yet"}` };
}

// Housekeeping

async function housekeeping(): Promise<Outcome> {
  await purgeStale();
  const now = new Date();
  await db().delete(schema.sessions).where(lt(schema.sessions.expiresAt, now));
  await db().delete(schema.loginTokens).where(lt(schema.loginTokens.expiresAt, new Date(now.getTime() - 86_400_000)));
  await db().delete(schema.rateLimits).where(lt(schema.rateLimits.windowStart, new Date(now.getTime() - 86_400_000)));
  // Raw events are kept 25 months, then only aggregates matter.
  await db().delete(schema.analyticsEvents).where(sql`ts < now() - interval '25 months' and not is_demo`);
  return { records: 0 };
}
