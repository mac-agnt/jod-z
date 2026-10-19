import "server-only";
import { z } from "zod";

// Every integration is optional: without its keys the site falls back to a
// clearly-labelled demo mode (dev) or disables that feature (production).
// Empty strings in .env files count as unset.
const opt = z.string().trim().optional().transform((v) => (v ? v : undefined));
const list = opt.transform((v) => (v ? v.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean) : []));

const schema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  NEXT_PUBLIC_SITE_URL: opt,
  DATABASE_URL: opt,
  AUTH_SECRET: opt,
  ADMIN_EMAILS: list,

  COMMERCE_MODE: z.enum(["auto", "shopify", "permalink", "demo"]).default("auto"),
  SHOPIFY_STORE_DOMAIN: opt,
  SHOPIFY_STOREFRONT_TOKEN: opt,
  SHOPIFY_ADMIN_TOKEN: opt,
  SHOPIFY_WEBHOOK_SECRET: opt,
  SHOPIFY_API_VERSION: z.string().default("2026-07"),

  KLAVIYO_PRIVATE_KEY: opt,
  KLAVIYO_LIST_ID: opt,

  META_ACCESS_TOKEN: opt,
  META_AD_ACCOUNT_ID: opt,
  META_GRAPH_VERSION: z.string().default("v23.0"),

  RESEND_API_KEY: opt,
  EMAIL_FROM: z.string().default("Jod-Z <hello@jod-z.com>"),
  EMAIL_NOTIFY: opt,

  TURNSTILE_SECRET_KEY: opt,
  CRON_SECRET: opt,
});

export type Env = z.infer<typeof schema>;
export const env: Env = schema.parse(process.env);

export const isProd = env.NODE_ENV === "production";

export type CommerceMode = "shopify" | "permalink" | "demo" | "off";

/** Which commerce backend handles stock and checkout. */
export function commerceMode(): CommerceMode {
  const m = env.COMMERCE_MODE;
  if (m === "shopify") return env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_TOKEN ? "shopify" : "off";
  if (m === "permalink") return env.SHOPIFY_STORE_DOMAIN ? "permalink" : "off";
  if (m === "demo") return "demo";
  if (env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_STOREFRONT_TOKEN) return "shopify";
  if (env.SHOPIFY_STORE_DOMAIN) return "permalink";
  // Never take fake orders in production.
  return isProd ? "off" : "demo";
}

export const integrations = () => ({
  database: !!env.DATABASE_URL,
  commerce: commerceMode(),
  shopifyAdmin: !!(env.SHOPIFY_STORE_DOMAIN && env.SHOPIFY_ADMIN_TOKEN),
  shopifyWebhooks: !!env.SHOPIFY_WEBHOOK_SECRET,
  klaviyo: !!(env.KLAVIYO_PRIVATE_KEY && env.KLAVIYO_LIST_ID),
  meta: !!(env.META_ACCESS_TOKEN && env.META_AD_ACCOUNT_ID),
  email: !!env.RESEND_API_KEY,
  turnstile: !!env.TURNSTILE_SECRET_KEY,
  cron: !!env.CRON_SECRET,
  pixel: !!process.env.NEXT_PUBLIC_META_PIXEL_ID,
  ga4: !!process.env.NEXT_PUBLIC_GA4_ID,
  sentry: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
});

/** Secret used for HMACs (visitor hashes, signed links). */
export function authSecret(): string {
  if (env.AUTH_SECRET) return env.AUTH_SECRET;
  if (isProd) throw new Error("AUTH_SECRET is not set. Generate one with `openssl rand -base64 32`.");
  return "dev-only-secret-do-not-use-in-production";
}
