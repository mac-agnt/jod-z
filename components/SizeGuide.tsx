"use client";
import { useState } from "react";

// Age guide and jockey sizes as published on jod-z.com. Add measurements
// in cm here once Jody supplies the garment spec.
const tables = {
  Leggings: {
    head: ["Size", "Age guide"],
    rows: [
      ["2XS", "6 to 7 years"],
      ["XS", "8 to 9 years"],
      ["S", "10 to 11 years"],
      ["M", "12 to 13 years"],
      ["L", "14 to 15 years"],
    ],
    note: "Sizes go by age. Tall or broad for their age? Size up for a comfortable fit in the saddle.",
  },
  Breeches: {
    head: ["Size", "Waist cm"],
    rows: [
      ['26"', "66"],
      ['28"', "71"],
      ['30"', "76"],
      ['32"', "81"],
    ],
    note: "Jockey sizes are your waist in inches. Between sizes, size up and take in the adjustable waistband.",
  },
} as const;

export type SizeTab = keyof typeof tables;

export function SizeGuide({ initial = "Leggings" }: { initial?: SizeTab }) {
  const [tab, setTab] = useState<SizeTab>(initial);
  const t = tables[tab];
  return (
    <div className="size-guide">
      <div className="tabs" role="tablist" aria-label="Garment">
        {(Object.keys(tables) as SizeTab[]).map((k) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className="tab" onClick={() => setTab(k)}>{k}</button>
        ))}
      </div>
      <div className="table-wrap" role="tabpanel">
        <table>
          <thead><tr>{t.head.map((h) => <th key={h} scope="col">{h}</th>)}</tr></thead>
          <tbody>{t.rows.map((r) => <tr key={r[0]}>{r.map((c, i) => (i === 0 ? <th key={i} scope="row">{c}</th> : <td key={i}>{c}</td>))}</tr>)}</tbody>
        </table>
      </div>
      {tab === "Breeches" && (
        <div className="measure">
          <div><span className="label">Waist</span><p>Around the natural waist, the narrowest point, over light clothing.</p></div>
        </div>
      )}
      <p className="small muted">{t.note} Still unsure? Email hello@jod-z.com with age, height and usual size.</p>
    </div>
  );
}
