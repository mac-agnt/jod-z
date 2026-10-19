// Number and date formatting for the dashboard and portals (en-IE, euro).

const eur0 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
const eur2 = new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: 2, maximumFractionDigits: 2 });
const int = new Intl.NumberFormat("en-IE", { maximumFractionDigits: 0 });
const compactN = new Intl.NumberFormat("en-IE", { notation: "compact", maximumFractionDigits: 1 });

export type Fmt = "eur" | "eur2" | "int" | "pct" | "x";

export function fmt(v: number | null | undefined, f: Fmt = "int", compact = false): string {
  if (v == null || Number.isNaN(v)) return "n/a";
  if (f === "pct") return `${(v * 100).toFixed(v < 0.1 ? 2 : 1)}%`;
  if (f === "x") return `${v.toFixed(2)}×`;
  if (compact && Math.abs(v) >= 1000) return (f === "eur" || f === "eur2" ? "€" : "") + compactN.format(v);
  if (f === "eur") return eur0.format(v);
  if (f === "eur2") return eur2.format(v);
  return int.format(v);
}

export const dateShort = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-IE", { day: "numeric", month: "short", timeZone: "UTC" });
export const dateTime = (d: string | Date) => new Date(d).toLocaleString("en-IE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Dublin" });
export const dateLong = (d: string | Date) => new Date(d).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric", timeZone: "Europe/Dublin" });

/** Relative change, or null when there is no base to compare with. */
export const change = (cur: number, prev: number) => (prev ? (cur - prev) / Math.abs(prev) : null);

const SOURCES: Record<string, string> = { facebook: "Facebook and Instagram ads", fb: "Facebook and Instagram ads", meta: "Facebook and Instagram ads", ig: "Instagram", instagram: "Instagram", google: "Google", direct: "Direct", klaviyo: "Email", email: "Email", tiktok: "TikTok" };
/** Human name for a utm_source or referrer host. */
export const sourceLabel = (s: string) => SOURCES[s.toLowerCase()] ?? s.replace(/^www\./, "").replace(/^\w/, (c) => c.toUpperCase());
