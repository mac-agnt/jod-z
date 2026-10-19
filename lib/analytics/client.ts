// Browser-side tracking. Every event goes to the first-party endpoint
// (/api/t: cookieless, no personal data). GA4 and the Meta Pixel only
// receive events when the visitor has consented and their scripts loaded.
import type { Attribution } from "../commerce/types";

export type EventName = "page_view" | "view_item" | "select_colour" | "add_to_cart" | "begin_checkout" | "sign_up" | "apply_ambassador" | "apply_retailer" | "contact";

type Props = { product?: string; colour?: string; size?: string; value?: number; pairs?: number };

type Gtag = (...args: unknown[]) => void;
type Fbq = (...args: unknown[]) => void;
declare global {
  interface Window { gtag?: Gtag; fbq?: Fbq }
}

const ATTR = "jz-attr";
const REF = "jz-ref";
const REF_DAYS = 30;

const read = <T,>(store: Storage | undefined, key: string): T | null => {
  try { const v = store?.getItem(key); return v ? (JSON.parse(v) as T) : null; } catch { return null; }
};
const write = (store: Storage | undefined, key: string, v: unknown) => {
  try { store?.setItem(key, JSON.stringify(v)); } catch {}
};
const ls = () => (typeof window === "undefined" ? undefined : window.localStorage);
const ss = () => (typeof window === "undefined" ? undefined : window.sessionStorage);

/**
 * Remembers where this visit came from (first touch per session) and any
 * ambassador code in the link (?ref= or ?code=), so both reach the order.
 */
export function captureAttribution() {
  const url = new URL(window.location.href);
  const q = url.searchParams;
  const code = (q.get("ref") ?? q.get("code"))?.trim();
  if (code && /^[A-Za-z0-9-]{3,40}$/.test(code)) write(ls(), REF, { code: code.toUpperCase(), until: Date.now() + REF_DAYS * 86_400_000 });
  if (read(ss(), ATTR)) return;
  let referrer: string | undefined;
  try { const r = document.referrer && new URL(document.referrer); if (r && r.host !== url.host) referrer = r.host; } catch {}
  write(ss(), ATTR, {
    utmSource: q.get("utm_source") ?? undefined,
    utmMedium: q.get("utm_medium") ?? undefined,
    utmCampaign: q.get("utm_campaign") ?? undefined,
    landing: url.pathname,
    referrer,
  } satisfies Attribution);
}

export function referralCode(): string | undefined {
  const r = read<{ code: string; until: number }>(ls(), REF);
  return r && r.until > Date.now() ? r.code : undefined;
}

export function getAttribution(): Attribution {
  return { ...(read<Attribution>(ss(), ATTR) ?? {}), code: referralCode() };
}

const item = (p: Props) => (p.product ? [{ item_id: `${p.product}:${p.colour ?? ""}`, item_variant: p.size, quantity: p.pairs ?? 1 }] : undefined);

export function track(name: EventName, props: Props = {}) {
  if (typeof window === "undefined") return;
  const a = read<Attribution>(ss(), ATTR) ?? {};
  const body = JSON.stringify({ name, path: window.location.pathname, ...props, utmSource: a.utmSource, utmMedium: a.utmMedium, utmCampaign: a.utmCampaign, referrer: a.referrer });
  try {
    if (!navigator.sendBeacon?.("/api/t", new Blob([body], { type: "application/json" }))) {
      fetch("/api/t", { method: "POST", body, keepalive: true, headers: { "Content-Type": "application/json" } }).catch(() => {});
    }
  } catch {}

  const money = props.value !== undefined ? { value: props.value, currency: "EUR" } : {};
  const ga: Partial<Record<EventName, string>> = { view_item: "view_item", add_to_cart: "add_to_cart", begin_checkout: "begin_checkout", sign_up: "generate_lead" };
  const fb: Partial<Record<EventName, string>> = { view_item: "ViewContent", add_to_cart: "AddToCart", begin_checkout: "InitiateCheckout", sign_up: "Lead", apply_ambassador: "SubmitApplication", apply_retailer: "SubmitApplication" };
  if (ga[name]) window.gtag?.("event", ga[name], { ...money, items: item(props) });
  if (fb[name]) window.fbq?.("track", fb[name], { ...money, content_type: "product", content_ids: props.product ? [`${props.product}:${props.colour ?? ""}`] : undefined });
}
