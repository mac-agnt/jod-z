"use client";
import { useState } from "react";

// Age guide and jockey sizes from jod-z.com. Measurements are indicative:
// replace with Jody's size chart before launch.
const tables = {
  Leggings: {
    head: ["Size", "Age guide", "Waist cm", "Hip cm", "Inside leg cm"],
    rows: [
      ["2XS", "6 to 7", "54 to 57", "62 to 66", "56"],
      ["XS", "8 to 9", "57 to 60", "66 to 71", "61"],
      ["S", "10 to 11", "60 to 64", "71 to 77", "66"],
      ["M", "12 to 13", "64 to 68", "77 to 83", "70"],
      ["L", "14 to 15", "68 to 73", "83 to 89", "73"],
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
      <div className="measure">
        <div><span className="label">Waist</span><p>Around the natural waist, the narrowest point.</p></div>
        <div><span className="label">Hip</span><p>Around the fullest part of the hips, feet together.</p></div>
        <div><span className="label">Inside leg</span><p>From the crotch to the ankle bone.</p></div>
      </div>
      <p className="small muted">{t.note} Indicative measurements, final chart to be confirmed.</p>
    </div>
  );
}
