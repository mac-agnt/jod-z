"use client";
import type { Pack } from "@/lib/offer";
import { formatPrice } from "@/lib/products";

export function PackPicker({ packs, value, onChange, unit }: { packs: Pack[]; value: number; onChange: (p: Pack) => void; unit: number }) {
  return (
    <div className="packs" role="radiogroup" aria-label="Choose your pack">
      {packs.map((p) => {
        const was = unit * p.pairs;
        return (
          <button key={p.pairs} type="button" role="radio" aria-checked={value === p.pairs} className="pack" onClick={() => onChange(p)}>
            {p.tag && <span className="pack-tag">{p.tag}</span>}
            <span className="pack-label">{p.label}</span>
            <span className="pack-price">
              {was > p.price && <s>{formatPrice(was)}</s>} {formatPrice(p.price)}
            </span>
          </button>
        );
      })}
    </div>
  );
}
