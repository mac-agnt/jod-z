import Link from "next/link";
import type { ReactNode } from "react";
import { change, fmt, type Fmt } from "@/lib/format";
import { RANGES } from "@/lib/metrics/range";
import { Sparkline, type Point } from "./charts";

/** label, value, change vs the previous period (coloured by whether up is good), optional trend. */
export function StatTile({ label, value, prev, format = "int", upIsGood = true, spark, note, hero }: { label: string; value: number | null; prev?: number | null; format?: Fmt; upIsGood?: boolean; spark?: Point[]; note?: string; hero?: boolean }) {
  const c = value != null && prev != null ? change(value, prev) : null;
  const good = c == null || c === 0 ? undefined : c > 0 === upIsGood;
  return (
    <div className={`ad-stat${hero ? " ad-hero" : ""}`}>
      <p className="ad-stat-label">{label}</p>
      <p className="ad-stat-value">{fmt(value, format)}</p>
      <p className="ad-stat-meta">
        {c != null && (
          <span className={`ad-delta ${good === undefined ? "" : good ? "up" : "down"}`}>
            <span aria-hidden="true">{c > 0 ? "▲" : c < 0 ? "▼" : "•"}</span> {fmt(Math.abs(c), "pct")}
            <span className="sr-only">{c > 0 ? " up" : " down"} on the previous period</span>
          </span>
        )}
        {note && <span className="ad-stat-note">{note}</span>}
      </p>
      {spark && <Sparkline points={spark} />}
    </div>
  );
}

export function PageHead({ title, sub, range, path, children }: { title: string; sub?: string; range?: string; path?: string; children?: ReactNode }) {
  return (
    <header className="ad-head">
      <div>
        <h1>{title}</h1>
        {sub && <p>{sub}</p>}
      </div>
      <div className="ad-head-tools">
        {range && path && (
          <nav className="ad-range" aria-label="Date range">
            {RANGES.map((r) => <Link key={r.key} href={`${path}?range=${r.key}`} aria-current={r.key === range ? "true" : undefined} scroll={false}>{r.label.replace("Last ", "")}</Link>)}
          </nav>
        )}
        {children}
      </div>
    </header>
  );
}

export function Badge({ tone = "neutral", children }: { tone?: "good" | "warn" | "bad" | "neutral" | "info"; children: ReactNode }) {
  const icon = { good: "✓", warn: "!", bad: "×", neutral: "", info: "" }[tone];
  return <span className={`ad-badge ${tone}`}>{icon && <span aria-hidden="true">{icon}</span>}{children}</span>;
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="ad-empty">{children}</p>;
}
