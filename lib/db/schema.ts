import { sql } from "drizzle-orm";
import { bigserial, boolean, date, index, integer, jsonb, numeric, pgTable, primaryKey, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";

// Status fields are text with a TypeScript union rather than Postgres enums,
// so adding a state is a code change, not a migration.

const id = () => uuid("id").primaryKey().default(sql`gen_random_uuid()`);
const createdAt = () => timestamp("created_at", { withTimezone: true }).notNull().defaultNow();
const money = (name: string) => numeric(name, { precision: 12, scale: 2, mode: "number" }).notNull().default(0);

export type Role = "admin" | "retailer" | "ambassador";

export const users = pgTable("users", {
  id: id(),
  email: text("email").notNull().unique(),
  name: text("name"),
  role: text("role").$type<Role>().notNull(),
  createdAt: createdAt(),
  lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
});

export const loginTokens = pgTable("login_tokens", {
  id: id(),
  email: text("email").notNull(),
  tokenHash: text("token_hash").notNull().unique(),
  next: text("next"),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  usedAt: timestamp("used_at", { withTimezone: true }),
  createdAt: createdAt(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(), // sha256 of the cookie value
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  userAgent: text("user_agent"),
  createdAt: createdAt(),
}, (t) => [index("sessions_user_idx").on(t.userId)]);

export type SubscriberStatus = "pending" | "subscribed" | "unsubscribed";

export const subscribers = pgTable("subscribers", {
  id: id(),
  email: text("email").notNull().unique(),
  firstName: text("first_name"),
  source: text("source").notNull(),
  status: text("status").$type<SubscriberStatus>().notNull().default("pending"),
  ageConfirmed: boolean("age_confirmed").notNull().default(false),
  consentText: text("consent_text").notNull(),
  consentAt: timestamp("consent_at", { withTimezone: true }).notNull().defaultNow(),
  confirmTokenHash: text("confirm_token_hash"),
  confirmedAt: timestamp("confirmed_at", { withTimezone: true }),
  unsubscribedAt: timestamp("unsubscribed_at", { withTimezone: true }),
  klaviyoSyncedAt: timestamp("klaviyo_synced_at", { withTimezone: true }),
  utmSource: text("utm_source"),
  utmCampaign: text("utm_campaign"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
}, (t) => [index("subscribers_created_idx").on(t.createdAt)]);

export type AmbassadorStatus = "awaiting_guardian" | "applied" | "approved" | "rejected" | "paused";

export const ambassadors = pgTable("ambassadors", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  handle: text("handle"),
  under16: boolean("under_16").notNull().default(false),
  guardianName: text("guardian_name"),
  guardianEmail: text("guardian_email"),
  guardianTokenHash: text("guardian_token_hash"),
  guardianConsentAt: timestamp("guardian_consent_at", { withTimezone: true }),
  status: text("status").$type<AmbassadorStatus>().notNull().default("applied"),
  code: text("code").unique(),
  discountPct: integer("discount_pct").notNull().default(10),
  commissionPct: integer("commission_pct").notNull().default(10),
  shopifyDiscountId: text("shopify_discount_id"),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  source: text("source").notNull().default("popup"),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export type RetailerStatus = "applied" | "approved" | "rejected" | "paused";

export const retailers = pgTable("retailers", {
  id: id(),
  storeName: text("store_name").notNull(),
  contactName: text("contact_name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  website: text("website"),
  storeType: text("store_type"),
  address: text("address"),
  town: text("town"),
  country: text("country"),
  vatNumber: text("vat_number"),
  message: text("message"),
  status: text("status").$type<RetailerStatus>().notNull().default("applied"),
  tier: text("tier").notNull().default("Stockist"),
  paymentTerms: text("payment_terms").notNull().default("Prepay"),
  tradeDiscountPct: integer("trade_discount_pct").notNull().default(50),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  notes: text("notes"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
  decidedAt: timestamp("decided_at", { withTimezone: true }),
});

export type Channel = "web" | "wholesale";
export type Provider = "shopify" | "demo" | "portal";
export type OrderStatus = "pending" | "paid" | "partially_refunded" | "refunded" | "cancelled";
export type WholesaleStatus = "submitted" | "confirmed" | "shipped" | "delivered" | "cancelled";

export const orders = pgTable("orders", {
  id: id(),
  channel: text("channel").$type<Channel>().notNull(),
  provider: text("provider").$type<Provider>().notNull(),
  externalId: text("external_id"),
  number: text("number").notNull(),
  customerHash: text("customer_hash"),
  retailerId: uuid("retailer_id").references(() => retailers.id, { onDelete: "set null" }),
  country: text("country"),
  currency: text("currency").notNull().default("EUR"),
  subtotal: money("subtotal"),
  discountTotal: money("discount_total"),
  shippingTotal: money("shipping_total"),
  taxTotal: money("tax_total"),
  total: money("total"),
  refundedTotal: money("refunded_total"),
  discountCodes: text("discount_codes").array().notNull().default(sql`'{}'::text[]`),
  status: text("status").$type<OrderStatus>().notNull().default("paid"),
  wholesaleStatus: text("wholesale_status").$type<WholesaleStatus>(),
  paymentTerms: text("payment_terms"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  visitorId: text("visitor_id"),
  isFirstOrder: boolean("is_first_order"),
  isDemo: boolean("is_demo").notNull().default(false),
  placedAt: timestamp("placed_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [
  uniqueIndex("orders_provider_ext_idx").on(t.provider, t.externalId),
  index("orders_placed_idx").on(t.placedAt),
  index("orders_retailer_idx").on(t.retailerId),
]);

export const orderLines = pgTable("order_lines", {
  id: id(),
  orderId: uuid("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  product: text("product"),
  colour: text("colour"),
  size: text("size"),
  title: text("title").notNull(),
  quantity: integer("quantity").notNull(),
  unitPrice: money("unit_price"),
  total: money("total"),
}, (t) => [index("order_lines_order_idx").on(t.orderId)]);

export const inventory = pgTable("inventory", {
  product: text("product").notNull(),
  colour: text("colour").notNull(),
  size: text("size").notNull(),
  available: integer("available").notNull(),
  provider: text("provider").$type<"shopify" | "demo">().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
}, (t) => [primaryKey({ columns: [t.product, t.colour, t.size] })]);

export const adInsights = pgTable("ad_insights", {
  date: date("date").notNull(),
  level: text("level").$type<"campaign" | "ad">().notNull(),
  entityId: text("entity_id").notNull(),
  entityName: text("entity_name").notNull(),
  campaignId: text("campaign_id"),
  campaignName: text("campaign_name"),
  thumbnailUrl: text("thumbnail_url"),
  spend: money("spend"),
  impressions: integer("impressions").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  purchases: numeric("purchases", { precision: 12, scale: 2, mode: "number" }).notNull().default(0),
  purchaseValue: money("purchase_value"),
  isDemo: boolean("is_demo").notNull().default(false),
}, (t) => [primaryKey({ columns: [t.date, t.level, t.entityId] })]);

export const emailCampaigns = pgTable("email_campaigns", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject"),
  sentAt: timestamp("sent_at", { withTimezone: true }),
  recipients: integer("recipients").notNull().default(0),
  opens: integer("opens").notNull().default(0),
  clicks: integer("clicks").notNull().default(0),
  conversions: integer("conversions").notNull().default(0),
  revenue: money("revenue"),
  kind: text("kind").$type<"campaign" | "flow">().notNull().default("campaign"),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const listSnapshots = pgTable("list_snapshots", {
  date: date("date").primaryKey(),
  listSize: integer("list_size").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
});

export const analyticsEvents = pgTable("analytics_events", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  ts: timestamp("ts", { withTimezone: true }).notNull().defaultNow(),
  name: text("name").notNull(),
  path: text("path"),
  visitorId: text("visitor_id").notNull(),
  referrer: text("referrer"),
  utmSource: text("utm_source"),
  utmMedium: text("utm_medium"),
  utmCampaign: text("utm_campaign"),
  country: text("country"),
  device: text("device"),
  product: text("product"),
  colour: text("colour"),
  value: numeric("value", { precision: 12, scale: 2, mode: "number" }),
  isDemo: boolean("is_demo").notNull().default(false),
}, (t) => [index("events_ts_idx").on(t.ts), index("events_name_ts_idx").on(t.name, t.ts)]);

export const contactMessages = pgTable("contact_messages", {
  id: id(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  topic: text("topic").notNull(),
  orderNumber: text("order_number"),
  message: text("message").notNull(),
  status: text("status").$type<"new" | "replied" | "closed">().notNull().default("new"),
  isDemo: boolean("is_demo").notNull().default(false),
  createdAt: createdAt(),
});

export const rateLimits = pgTable("rate_limits", {
  key: text("key").primaryKey(),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull(),
  count: integer("count").notNull(),
});

export const syncRuns = pgTable("sync_runs", {
  id: id(),
  source: text("source").notNull(),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  finishedAt: timestamp("finished_at", { withTimezone: true }),
  ok: boolean("ok"),
  records: integer("records"),
  message: text("message"),
}, (t) => [index("sync_runs_source_idx").on(t.source, t.startedAt)]);

export const webhookEvents = pgTable("webhook_events", {
  id: text("id").primaryKey(),
  topic: text("topic").notNull(),
  receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
});

export const emailLog = pgTable("email_log", {
  id: id(),
  to: text("to").notNull(),
  template: text("template").notNull(),
  subject: text("subject").notNull(),
  status: text("status").$type<"sent" | "failed" | "logged">().notNull(),
  providerId: text("provider_id"),
  error: text("error"),
  createdAt: createdAt(),
});

export const auditLog = pgTable("audit_log", {
  id: id(),
  actor: text("actor").notNull(),
  action: text("action").notNull(),
  target: text("target"),
  detail: jsonb("detail"),
  createdAt: createdAt(),
});
