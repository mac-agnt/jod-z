// Cookie consent, stored in a first-party cookie the visitor can change at
// any time from "Cookie settings" in the footer. Necessary storage (bag,
// sign-in, security checks) never waits for consent; analytics and
// advertising scripts only load after an explicit yes.

export type Consent = { analytics: boolean; marketing: boolean; at: number; v: 1 };

const COOKIE = "jz_consent";
const DAYS = 180;
export const CONSENT_EVENT = "jz:consent";
export const OPEN_EVENT = "jz:consent-open";

/** Banner only matters if a non-essential tracker is configured. */
export const consentNeeded = () => !!(process.env.NEXT_PUBLIC_GA4_ID || process.env.NEXT_PUBLIC_META_PIXEL_ID);

export function readConsent(): Consent | null {
  if (typeof document === "undefined") return null;
  const raw = document.cookie.split("; ").find((c) => c.startsWith(`${COOKIE}=`))?.slice(COOKIE.length + 1);
  if (!raw) return null;
  try {
    const c = JSON.parse(decodeURIComponent(raw)) as Consent;
    return c.v === 1 ? c : null;
  } catch {
    return null;
  }
}

export function saveConsent(analytics: boolean, marketing: boolean) {
  const c: Consent = { analytics, marketing, at: Date.now(), v: 1 };
  const secure = location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${COOKIE}=${encodeURIComponent(JSON.stringify(c))}; Max-Age=${DAYS * 86400}; Path=/; SameSite=Lax${secure}`;
  window.dispatchEvent(new CustomEvent(CONSENT_EVENT, { detail: c }));
}

export const openConsentSettings = () => window.dispatchEvent(new Event(OPEN_EVENT));
