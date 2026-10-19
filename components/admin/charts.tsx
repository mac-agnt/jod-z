"use client";
import { useEffect, useId, useRef, useState, type KeyboardEvent, type ReactNode } from "react";
import { dateShort, fmt, type Fmt } from "@/lib/format";

// Dashboard charts, hand-built in SVG to the data-viz method: thin marks,
// hairline grid, one axis, legend for 2+ series, crosshair tooltip on lines,
// and a table view behind every chart. Colours are validated slots
// (gold, blue, aqua) against the dark card surface; see admin.css.

export type Point = { date: string; value: number };
export type Series = { name: string; slot: 1 | 2 | 3 | "muted"; points: Point[] };

const slotVar = (s: Series["slot"]) => (s === "muted" ? "var(--ad-series-muted)" : `var(--ad-series-${s})`);

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.floor(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

/** Round the axis top to a clean number. */
function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 2.5 ? 2.5 : n <= 5 ? 5 : 10) * p;
}

export function LineChart({ series, format = "int", height = 240, label }: { series: Series[]; format?: Fmt; height?: number; label: string }) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const tipId = useId();
  const pad = { l: 52, r: 16, t: 12, b: 28 };
  const n = series[0]?.points.length ?? 0;
  const max = niceMax(Math.max(0, ...series.flatMap((s) => s.points.map((p) => p.value))));
  const iw = Math.max(0, width - pad.l - pad.r), ih = height - pad.t - pad.b;
  const x = (i: number) => pad.l + (n <= 1 ? iw / 2 : (i / (n - 1)) * iw);
  const y = (v: number) => pad.t + ih - (v / max) * ih;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((k) => k * max);
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 90))));
  const path = (pts: Point[]) => pts.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join("");
  const single = series.length === 1;

  const move = (clientX: number, rect: DOMRect) => {
    const i = Math.round(((clientX - rect.left - pad.l) / (iw || 1)) * (n - 1));
    setHover(Math.min(n - 1, Math.max(0, i)));
  };
  const key = (e: KeyboardEvent) => {
    if (e.key === "ArrowRight") setHover((h) => Math.min(n - 1, (h ?? -1) + 1));
    if (e.key === "ArrowLeft") setHover((h) => Math.max(0, (h ?? n) - 1));
    if (e.key === "Escape") setHover(null);
  };

  return (
    <div className="ad-chart" ref={ref}>
      {!single && (
        <ul className="ad-legend">
          {series.map((s) => <li key={s.name}><span className="ad-key-line" style={{ background: slotVar(s.slot) }} />{s.name}</li>)}
        </ul>
      )}
      {width > 0 && n > 0 && (
        <svg width={width} height={height} role="img" aria-label={label}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={pad.l} x2={width - pad.r} y1={y(t)} y2={y(t)} className={t === 0 ? "ad-axis" : "ad-grid"} />
              <text x={pad.l - 8} y={y(t)} dy="0.32em" textAnchor="end" className="ad-tick">{fmt(t, format, true)}</text>
            </g>
          ))}
          {series[0].points.map((p, i) => (i % every === 0 || i === n - 1) && (
            <text key={p.date} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === n - 1 ? "end" : "middle"} className="ad-tick">{dateShort(p.date)}</text>
          ))}
          {single && <path d={`${path(series[0].points)}L${x(n - 1)},${y(0)}L${x(0)},${y(0)}Z`} fill={slotVar(series[0].slot)} opacity={0.1} />}
          {series.map((s) => <path key={s.name} d={path(s.points)} fill="none" stroke={slotVar(s.slot)} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />)}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={pad.t + ih} className="ad-cross" />
              {series.map((s) => <circle key={s.name} cx={x(hover)} cy={y(s.points[hover]?.value ?? 0)} r={4.5} fill={slotVar(s.slot)} stroke="var(--ad-surface)" strokeWidth={2} />)}
            </g>
          )}
          <rect
            x={pad.l} y={pad.t} width={iw} height={ih} fill="transparent" tabIndex={0} aria-describedby={hover !== null ? tipId : undefined}
            aria-label={`${label}. Use left and right arrow keys to read values.`}
            onPointerMove={(e) => move(e.clientX, e.currentTarget.getBoundingClientRect())} onPointerLeave={() => setHover(null)}
            onFocus={() => setHover(n - 1)} onBlur={() => setHover(null)} onKeyDown={key}
          />
        </svg>
      )}
      {hover !== null && width > 0 && (
        <div id={tipId} role="tooltip" className="ad-tip" style={{ left: Math.min(Math.max(x(hover), 90), width - 90), top: 0 }}>
          <p className="ad-tip-date">{dateShort(series[0].points[hover].date)}</p>
          {series.map((s) => (
            <p key={s.name} className="ad-tip-row"><span className="ad-key-line" style={{ background: slotVar(s.slot) }} /><strong>{fmt(s.points[hover]?.value, format)}</strong> <span>{s.name}</span></p>
          ))}
        </div>
      )}
    </div>
  );
}

export type BarRow = { key: string; label: ReactNode; value: number; note?: string; swatch?: string };

/** Horizontal bars, one hue, value at the tip. */
export function Bars({ rows, format = "int", label, empty = "Nothing in this period yet." }: { rows: BarRow[]; format?: Fmt; label: string; empty?: string }) {
  if (!rows.length) return <p className="ad-empty">{empty}</p>;
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <ul className="ad-bars" aria-label={label}>
      {rows.map((r) => (
        <li key={r.key} tabIndex={0} aria-label={`${typeof r.label === "string" ? r.label : r.key}: ${fmt(r.value, format)}${r.note ? `, ${r.note}` : ""}`}>
          <span className="ad-bar-label">{r.swatch && <span className="ad-swatch" style={{ background: r.swatch }} aria-hidden="true" />}{r.label}</span>
          <span className="ad-bar-track"><span className="ad-bar" style={{ width: `${Math.max(1, (r.value / max) * 100)}%` }} /></span>
          <span className="ad-bar-value">{fmt(r.value, format)}{r.note && <small>{r.note}</small>}</span>
        </li>
      ))}
    </ul>
  );
}

/** Ordered stages, each bar showing the share kept from the stage before. */
export function Funnel({ steps }: { steps: { label: string; value: number }[] }) {
  const top = Math.max(steps[0]?.value ?? 0, 1);
  return (
    <ol className="ad-funnel">
      {steps.map((s, i) => {
        const prev = i ? steps[i - 1].value : 0;
        return (
          <li key={s.label} tabIndex={0} aria-label={`${s.label}: ${fmt(s.value)}${i ? `, ${fmt(prev ? s.value / prev : 0, "pct")} of previous step` : ""}`}>
            <span className="ad-bar-label">{s.label}</span>
            <span className="ad-bar-track"><span className="ad-bar" style={{ width: `${Math.max(0.6, (s.value / top) * 100)}%` }} /></span>
            <span className="ad-bar-value">{fmt(s.value)}{i > 0 && <small>{fmt(prev ? s.value / prev : 0, "pct")} of previous</small>}</span>
          </li>
        );
      })}
    </ol>
  );
}

/** Part-to-whole in one bar, up to three parts, with a legend carrying the values. */
export function Split({ parts, label }: { parts: { label: string; value: number }[]; label: string }) {
  const total = parts.reduce((n, p) => n + p.value, 0) || 1;
  const shown = parts.slice(0, 3);
  return (
    <div className="ad-split">
      <div className="ad-split-bar" role="img" aria-label={`${label}: ${shown.map((p) => `${p.label} ${fmt(p.value / total, "pct")}`).join(", ")}`}>
        {shown.map((p, i) => <span key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: `var(--ad-series-${i + 1})` }} />)}
      </div>
      <ul className="ad-legend">
        {shown.map((p, i) => <li key={p.label}><span className="ad-key-box" style={{ background: `var(--ad-series-${i + 1})` }} />{p.label} <strong>{fmt(p.value / total, "pct")}</strong></li>)}
      </ul>
    </div>
  );
}

export function Sparkline({ points }: { points: Point[] }) {
  const w = 120, h = 32;
  if (points.length < 2) return null;
  const max = Math.max(...points.map((p) => p.value), 1);
  const d = points.map((p, i) => `${i ? "L" : "M"}${((i / (points.length - 1)) * w).toFixed(1)},${(h - 2 - (p.value / max) * (h - 4)).toFixed(1)}`).join("");
  return <svg className="ad-spark" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" aria-hidden="true"><path d={d} fill="none" stroke="var(--ad-series-1)" strokeWidth={1.5} strokeLinejoin="round" vectorEffect="non-scaling-stroke" /></svg>;
}

/** Card with a title and a table-view twin of the chart inside it. */
export function ChartCard({ title, sub, table, children, wide }: { title: string; sub?: string; table?: { head: string[]; rows: (string | number)[][] }; children: ReactNode; wide?: boolean }) {
  const [asTable, setAsTable] = useState(false);
  return (
    <section className={`ad-card${wide ? " ad-wide" : ""}`} aria-label={title}>
      <header className="ad-card-head">
        <div><h2>{title}</h2>{sub && <p>{sub}</p>}</div>
        {table && <button type="button" className="ad-toggle" aria-pressed={asTable} onClick={() => setAsTable(!asTable)}>{asTable ? "Chart" : "Table"}</button>}
      </header>
      {asTable && table ? (
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr>{table.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>{table.rows.map((r, i) => <tr key={i}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
          </table>
        </div>
      ) : children}
    </section>
  );
}
