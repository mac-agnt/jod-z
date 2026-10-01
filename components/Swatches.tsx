"use client";
import type { CSSProperties, KeyboardEvent } from "react";
import type { Colourway } from "@/lib/products";

type Props = { colourways: Colourway[]; active: Colourway; onChange: (c: Colourway) => void; size?: "lg" | "md" };

// Fabric tiles: each shows a crop of the real colourway render (or the
// fabric colour when there is no photo). Active tile gets a gold frame.
export function Swatches({ colourways, active, onChange, size = "lg" }: Props) {
  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + colourways.length) % colourways.length;
    onChange(colourways[j]);
    (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
  };
  return (
    <div className={`tiles tiles-${size}`} role="radiogroup" aria-label="Colour">
      {colourways.map((c, i) => (
        <button
          key={c.slug}
          type="button"
          role="radio"
          aria-checked={c.slug === active.slug}
          aria-label={c.name}
          data-name={c.name}
          tabIndex={c.slug === active.slug ? 0 : -1}
          className={`tile ${c.image ? "tile-photo" : ""}`}
          style={{ "--sw": c.hex, "--img": c.image ? `url(${c.image})` : "none" } as CSSProperties}
          onClick={() => onChange(c)}
          onKeyDown={(e) => onKey(e, i)}
        >
          <span className="tile-chip" />
        </button>
      ))}
    </div>
  );
}
