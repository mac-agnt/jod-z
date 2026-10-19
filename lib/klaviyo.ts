import "server-only";
import { env } from "./env";

const BASE = "https://a.klaviyo.com/api";
// Klaviyo retires API revisions after two years: bump this (or set KLAVIYO_REVISION) yearly.
const REVISION = process.env.KLAVIYO_REVISION ?? "2025-04-15";

export class KlaviyoError extends Error {}

export async function klaviyo<T>(path: string, init: { method?: string; body?: unknown } = {}): Promise<T> {
  if (!env.KLAVIYO_PRIVATE_KEY) throw new KlaviyoError("Klaviyo is not configured");
  const res = await fetch(`${BASE}${path}`, {
    method: init.method ?? "GET",
    headers: {
      Authorization: `Klaviyo-API-Key ${env.KLAVIYO_PRIVATE_KEY}`,
      revision: REVISION,
      accept: "application/vnd.api+json",
      "content-type": "application/vnd.api+json",
    },
    body: init.body ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(10000),
    cache: "no-store",
  });
  if (res.status === 202 || res.status === 204) return {} as T;
  const json = (await res.json().catch(() => ({}))) as T & { errors?: { detail: string }[] };
  if (!res.ok) throw new KlaviyoError(json.errors?.map((e) => e.detail).join("; ") || `Klaviyo HTTP ${res.status}`);
  return json;
}

/**
 * Adds a person to the marketing list with email consent. Klaviyo applies
 * the list's own double opt-in setting, so it sends the confirmation email.
 */
export async function subscribeToList(email: string, firstName: string | undefined, source: string) {
  if (firstName) {
    await klaviyo("/profile-import", {
      method: "POST",
      body: { data: { type: "profile", attributes: { email, first_name: firstName, properties: { signup_source: source } } } },
    });
  }
  await klaviyo("/profile-subscription-bulk-create-jobs", {
    method: "POST",
    body: {
      data: {
        type: "profile-subscription-bulk-create-job",
        attributes: {
          custom_source: `Website: ${source}`,
          profiles: { data: [{ type: "profile", attributes: { email, subscriptions: { email: { marketing: { consent: "SUBSCRIBED" } } } } }] },
          historical_import: false,
        },
        relationships: { list: { data: { type: "list", id: env.KLAVIYO_LIST_ID } } },
      },
    },
  });
}
