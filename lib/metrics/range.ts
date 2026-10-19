// Date ranges for the dashboard, in Irish time so "today" matches Jody's day.

export const RANGES = [
  { key: "7", label: "Last 7 days", days: 7 },
  { key: "30", label: "Last 30 days", days: 30 },
  { key: "90", label: "Last 90 days", days: 90 },
  { key: "365", label: "Last 12 months", days: 365 },
] as const;

export type Range = { key: string; label: string; days: number; start: string; end: string; prevStart: string; prevEnd: string };

const TZ = "Europe/Dublin";
export const dublinDate = (d = new Date()) => new Intl.DateTimeFormat("en-CA", { timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit" }).format(d);

export function addDays(iso: string, n: number) {
  const d = new Date(`${iso}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** Inclusive date range ending today, plus the same-length period before it. */
export function getRange(key?: string): Range {
  const r = RANGES.find((x) => x.key === key) ?? RANGES[1];
  const end = dublinDate();
  const start = addDays(end, -(r.days - 1));
  return { key: r.key, label: r.label, days: r.days, start, end, prevStart: addDays(start, -r.days), prevEnd: addDays(start, -1) };
}

export function daysBetween(start: string, end: string): string[] {
  const out: string[] = [];
  for (let d = start; d <= end; d = addDays(d, 1)) out.push(d);
  return out;
}
