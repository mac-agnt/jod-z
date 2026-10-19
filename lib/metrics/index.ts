import "server-only";
import { sql, type SQL } from "drizzle-orm";
import { db } from "../db";
import { daysBetween, type Range } from "./range";

// Read models for the dashboard. Every query works on the local database,
// which webhooks and syncs keep current, so pages stay fast and keep
// history even when an external API is slow or down.

const q = async <T>(query: SQL) => (await db().execute(query)) as unknown as T[];
const local = sql`(placed_at at time zone 'Europe/Dublin')::date`;
const evDay = sql`(ts at time zone 'Europe/Dublin')::date`;
const inRange = (s: string, e: string) => sql`${local} between ${s}::date and ${e}::date`;
const WEB = sql`channel = 'web' and status <> 'cancelled'`;

export type Point = { date: string; value: number };

function fill(range: { start: string; end: string }, rows: { date: string; value: number }[]): Point[] {
  const m = new Map(rows.map((r) => [String(r.date).slice(0, 10), Number(r.value)]));
  return daysBetween(range.start, range.end).map((date) => ({ date, value: m.get(date) ?? 0 }));
}

// Sales

export async function salesKpis(s: string, e: string) {
  const [o] = await q<{ orders: number; revenue: number; refunds: number; discounts: number; newCustomers: number }>(sql`
    select count(*)::int orders, coalesce(sum(total - refunded_total), 0)::float8 revenue, coalesce(sum(refunded_total), 0)::float8 refunds,
      coalesce(sum(discount_total), 0)::float8 discounts, count(*) filter (where is_first_order)::int "newCustomers"
    from orders where ${WEB} and ${inRange(s, e)}`);
  const [u] = await q<{ units: number }>(sql`
    select coalesce(sum(l.quantity), 0)::int units from order_lines l join orders o on o.id = l.order_id
    where o.channel = 'web' and o.status <> 'cancelled' and (o.placed_at at time zone 'Europe/Dublin')::date between ${s}::date and ${e}::date`);
  return { ...o, units: u.units, aov: o.orders ? o.revenue / o.orders : 0 };
}

export async function revenueByDay(r: { start: string; end: string }) {
  const rows = await q<{ date: string; value: number }>(sql`
    select ${local}::text date, sum(total - refunded_total)::float8 value from orders
    where ${WEB} and ${inRange(r.start, r.end)} group by 1`);
  return fill(r, rows);
}

export async function ordersByDay(r: { start: string; end: string }) {
  const rows = await q<{ date: string; value: number }>(sql`select ${local}::text date, count(*)::int value from orders where ${WEB} and ${inRange(r.start, r.end)} group by 1`);
  return fill(r, rows);
}

export type Breakdown = { key: string; units: number; revenue: number; orders?: number };

export async function salesByLine(dim: "colour" | "size" | "product", s: string, e: string): Promise<Breakdown[]> {
  const col = dim === "colour" ? sql`l.colour` : dim === "size" ? sql`l.size` : sql`l.product`;
  return q<Breakdown>(sql`
    select coalesce(${col}, 'Other') key, sum(l.quantity)::int units, sum(l.total)::float8 revenue
    from order_lines l join orders o on o.id = l.order_id
    where o.channel = 'web' and o.status <> 'cancelled' and (o.placed_at at time zone 'Europe/Dublin')::date between ${s}::date and ${e}::date
    group by 1 order by revenue desc`);
}

export async function salesByOrder(dim: "country" | "source", s: string, e: string): Promise<Breakdown[]> {
  const col = dim === "country" ? sql`coalesce(country, 'Unknown')` : sql`coalesce(utm_source, 'direct')`;
  return q<Breakdown>(sql`
    select ${col} key, count(*)::int orders, 0 units, sum(total - refunded_total)::float8 revenue
    from orders where ${WEB} and ${inRange(s, e)} group by 1 order by revenue desc`);
}

export async function recentOrders(limit = 25, channel: "web" | "wholesale" = "web") {
  return q<{ id: string; number: string; placedAt: string; country: string | null; total: number; refunded: number; status: string; codes: string[]; source: string | null; items: string; isDemo: boolean; wholesaleStatus: string | null; store: string | null }>(sql`
    select o.id, o.number, o.placed_at "placedAt", o.country, o.total::float8 total, o.refunded_total::float8 refunded, o.status, o.discount_codes codes, o.utm_source source, o.is_demo "isDemo",
      o.wholesale_status "wholesaleStatus", r.store_name store,
      (select string_agg(l.title, '; ' order by l.title) from order_lines l where l.order_id = o.id) items
    from orders o left join retailers r on r.id = o.retailer_id
    where o.channel = ${channel} order by o.placed_at desc limit ${limit}`);
}

// Ads

export async function adsKpis(s: string, e: string) {
  const [a] = await q<{ spend: number; impressions: number; clicks: number; purchases: number; value: number }>(sql`
    select coalesce(sum(spend), 0)::float8 spend, coalesce(sum(impressions), 0)::int impressions, coalesce(sum(clicks), 0)::int clicks,
      coalesce(sum(purchases), 0)::float8 purchases, coalesce(sum(purchase_value), 0)::float8 value
    from ad_insights where level = 'campaign' and date between ${s}::date and ${e}::date`);
  return { ...a, ctr: a.impressions ? a.clicks / a.impressions : 0, cpc: a.clicks ? a.spend / a.clicks : 0, cpm: a.impressions ? (a.spend / a.impressions) * 1000 : 0, roas: a.spend ? a.value / a.spend : 0, cpa: a.purchases ? a.spend / a.purchases : 0 };
}

export async function adsByDay(r: { start: string; end: string }) {
  const rows = await q<{ date: string; spend: number; value: number }>(sql`
    select date::text date, sum(spend)::float8 spend, sum(purchase_value)::float8 value from ad_insights
    where level = 'campaign' and date between ${r.start}::date and ${r.end}::date group by 1`);
  return { spend: fill(r, rows.map((x) => ({ date: x.date, value: x.spend }))), value: fill(r, rows.map((x) => ({ date: x.date, value: x.value }))) };
}

export type AdRow = { id: string; name: string; campaign: string | null; thumb: string | null; spend: number; impressions: number; clicks: number; purchases: number; value: number };

export async function adsTable(level: "campaign" | "ad", s: string, e: string) {
  return q<AdRow>(sql`
    select entity_id id, max(entity_name) name, max(campaign_name) campaign, max(thumbnail_url) thumb, sum(spend)::float8 spend, sum(impressions)::int impressions,
      sum(clicks)::int clicks, sum(purchases)::float8 purchases, sum(purchase_value)::float8 value
    from ad_insights where level = ${level} and date between ${s}::date and ${e}::date group by entity_id order by spend desc`);
}

// Email

export async function emailKpis(r: Range) {
  const [cur] = await q<{ size: number | null }>(sql`select list_size::int size from list_snapshots where date <= ${r.end}::date order by date desc limit 1`);
  const [before] = await q<{ size: number | null }>(sql`select list_size::int size from list_snapshots where date < ${r.start}::date order by date desc limit 1`);
  const [signups] = await q<{ total: number; confirmed: number }>(sql`
    select count(*)::int total, count(*) filter (where status = 'subscribed')::int confirmed from subscribers
    where (created_at at time zone 'Europe/Dublin')::date between ${r.start}::date and ${r.end}::date`);
  const [camp] = await q<{ sent: number; recipients: number; opens: number; clicks: number; revenue: number }>(sql`
    select count(*)::int sent, coalesce(sum(recipients), 0)::int recipients, coalesce(sum(opens), 0)::int opens, coalesce(sum(clicks), 0)::int clicks, coalesce(sum(revenue), 0)::float8 revenue
    from email_campaigns where kind = 'campaign' and (sent_at at time zone 'Europe/Dublin')::date between ${r.start}::date and ${r.end}::date`);
  return { listSize: cur?.size ?? null, growth: cur?.size != null && before?.size != null ? cur.size - before.size : null, signups: signups.total, confirmed: signups.confirmed, ...camp };
}

export async function listSizeByDay(r: { start: string; end: string }) {
  const rows = await q<{ date: string; value: number }>(sql`select date::text date, list_size::int value from list_snapshots where date between ${r.start}::date and ${r.end}::date order by date`);
  return rows.map((x) => ({ date: x.date, value: Number(x.value) }));
}

export async function signupsBySource(s: string, e: string) {
  return q<{ key: string; value: number }>(sql`
    select source key, count(*)::int value from subscribers where (created_at at time zone 'Europe/Dublin')::date between ${s}::date and ${e}::date
    and status <> 'unsubscribed' group by 1 order by 2 desc`);
}

export async function emailTable(kind: "campaign" | "flow", s?: string, e?: string) {
  const when = kind === "campaign" && s && e ? sql`and (sent_at at time zone 'Europe/Dublin')::date between ${s}::date and ${e}::date` : sql``;
  return q<{ id: string; name: string; sentAt: string | null; recipients: number; opens: number; clicks: number; conversions: number; revenue: number }>(sql`
    select id, name, sent_at "sentAt", recipients, opens, clicks, conversions, revenue::float8 revenue from email_campaigns
    where kind = ${kind} ${when} order by ${kind === "campaign" ? sql`sent_at desc` : sql`revenue desc`}`);
}

// Traffic

export async function trafficKpis(s: string, e: string) {
  const [t] = await q<{ visitors: number; views: number; viewed: number; added: number; checkout: number }>(sql`
    select
      count(distinct (visitor_id, ${evDay}))::int visitors,
      count(*) filter (where name = 'page_view')::int views,
      count(distinct (visitor_id, ${evDay})) filter (where name = 'view_item')::int viewed,
      count(distinct (visitor_id, ${evDay})) filter (where name = 'add_to_cart')::int added,
      count(distinct (visitor_id, ${evDay})) filter (where name = 'begin_checkout')::int checkout
    from analytics_events where ${evDay} between ${s}::date and ${e}::date`);
  return t;
}

export async function visitorsByDay(r: { start: string; end: string }) {
  const rows = await q<{ date: string; value: number }>(sql`
    select ${evDay}::text date, count(distinct visitor_id)::int value from analytics_events
    where ${evDay} between ${r.start}::date and ${r.end}::date group by 1`);
  return fill(r, rows);
}

export async function trafficBy(dim: "source" | "page" | "device" | "country", s: string, e: string) {
  const col = dim === "source" ? sql`coalesce(utm_source, referrer, 'direct')` : dim === "page" ? sql`path` : dim === "device" ? sql`coalesce(device, 'unknown')` : sql`coalesce(country, 'Unknown')`;
  const views = dim === "page" ? sql`count(*)` : sql`count(distinct (visitor_id, ${evDay}))`;
  const filter = dim === "page" ? sql`and name = 'page_view'` : sql``;
  return q<{ key: string; value: number }>(sql`
    select ${col} key, ${views}::int value from analytics_events
    where ${evDay} between ${s}::date and ${e}::date ${filter} group by 1 order by 2 desc limit 12`);
}

// Inventory

export async function inventoryGrid() {
  return q<{ product: string; colour: string; size: string; available: number; sold30: number; provider: string; updatedAt: string }>(sql`
    select i.product, i.colour, i.size, i.available, i.provider, i.updated_at "updatedAt",
      coalesce((select sum(l.quantity) from order_lines l join orders o on o.id = l.order_id
        where o.channel = 'web' and o.status <> 'cancelled' and o.placed_at > now() - interval '30 days'
        and l.product = i.product and l.colour = i.colour and l.size = i.size), 0)::int sold30
    from inventory i`);
}

// Partners

/** Code sales for commission: item value after discounts and refunds, delivery excluded, paid orders only. */
export async function ambassadorSales(s: string, e: string) {
  return q<{ code: string; orders: number; revenue: number }>(sql`
    select code, count(*)::int orders, sum(greatest(subtotal - discount_total - refunded_total, 0))::float8 revenue
    from orders, unnest(discount_codes) code
    where channel = 'web' and status in ('paid', 'partially_refunded') and ${inRange(s, e)} group by 1`);
}

export async function wholesaleTotals() {
  return q<{ retailerId: string; orders: number; units: number; value: number; last: string | null }>(sql`
    select o.retailer_id "retailerId", count(distinct o.id)::int orders, coalesce(sum(l.quantity), 0)::int units, coalesce(sum(l.total), 0)::float8 value, max(o.placed_at)::text last
    from orders o left join order_lines l on l.order_id = o.id
    where o.channel = 'wholesale' and o.wholesale_status <> 'cancelled' group by 1`);
}

// Housekeeping

export async function hasDemoData() {
  const [r] = await q<{ demo: boolean }>(sql`
    select exists(select 1 from orders where is_demo) or exists(select 1 from ad_insights where is_demo)
      or exists(select 1 from analytics_events where is_demo limit 1) demo`);
  return r.demo;
}

export async function lastSyncs() {
  return q<{ source: string; startedAt: string; finishedAt: string | null; ok: boolean | null; records: number | null; message: string | null }>(sql`
    select distinct on (source) source, started_at "startedAt", finished_at "finishedAt", ok, records, message
    from sync_runs order by source, started_at desc`);
}

export async function inboxCounts() {
  const [c] = await q<{ messages: number; ambassadors: number; retailers: number; wholesale: number }>(sql`
    select (select count(*) from contact_messages where status = 'new')::int messages,
      (select count(*) from ambassadors where status = 'applied')::int ambassadors,
      (select count(*) from retailers where status = 'applied')::int retailers,
      (select count(*) from orders where channel = 'wholesale' and wholesale_status = 'submitted')::int wholesale`);
  return c;
}
