"use client";
import { useId, useState, type CSSProperties } from "react";

export type Spot = { x: number; y: number; title: string; body: string };

// Feature callouts pinned to the studio renders (positions are % of the
// 1122x1402 frame, which every colourway shares). Keyed by product slug.
export const spotsFor: Record<string, Spot[]> = {
  "the-jod-z": [
    { x: 48, y: 9, title: "High-waisted fit", body: "Sits high and stays put." },
    { x: 61, y: 23, title: "Phone and treat pockets", body: "Room for a phone and treats." },
    { x: 53, y: 40, title: "Fully opaque", body: "4-way stretch. No see-through." },
    { x: 34, y: 53, title: "Silicone knee grip", body: "Holds you in the saddle." },
  ],
  "jockey-breech": [
    { x: 45, y: 11, title: "Adjustable waistband", body: "Fine-tune the fit." },
    { x: 64, y: 21, title: "Zipped hip pockets", body: "Keeps your phone secure." },
    { x: 38, y: 58, title: "Suede knee panels", body: "Grip where it counts." },
    { x: 42, y: 80, title: "Stretch ankle cuffs", body: "Sits neat under boots." },
  ],
};

export function Hotspots({ spots }: { spots: Spot[] }) {
  const id = useId();
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="hs-layer">
      {spots.map((s, k) => {
        const tip = `${id}-tip-${k}`;
        const pos = { left: `${s.x}%`, top: `${s.y}%`, "--k": k } as CSSProperties;
        return (
          <div key={s.title} className={`hs ${open === k ? "on" : ""} ${s.x > 55 ? "hs-l" : ""}`} style={pos}>
            <button
              type="button"
              className="hs-btn"
              aria-expanded={open === k}
              aria-describedby={tip}
              onClick={() => setOpen(open === k ? null : k)}
              onMouseEnter={() => setOpen(k)}
              onMouseLeave={() => setOpen(null)}
              onFocus={() => setOpen(k)}
              onBlur={() => setOpen(null)}
              onKeyDown={(e) => { if (e.key === "Escape") setOpen(null); }}
            >
              <span className="hs-dot" aria-hidden="true" />
              <span className="sr-only">{s.title}</span>
            </button>
            <div className="hs-tip" role="tooltip" id={tip}>
              <strong>{s.title}</strong>
              <span>{s.body}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
