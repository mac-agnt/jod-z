import Image from "next/image";
import type { Product } from "@/lib/products";
import { ProductRender } from "./Render";

// Every colourway image stacked; the active one crossfades in, so a swatch
// click feels like the same garment changing colour, not a new page.
// `eager` loads the stack up front (PDP, above the fold); elsewhere it loads as
// it nears the viewport. The hidden colours load at low priority so they never
// hold up the one on show.
export function ColourImage({ product, active, sizes, eager = false }: { product: Product; active: string; sizes: string; eager?: boolean }) {
  const current = product.colourways.find((c) => c.slug === active) ?? product.colourways[0];
  if (!current.image) {
    return <ProductRender key={current.slug} kind={product.kind} hex={current.hex} className="fade-swap" title={`${product.name} in ${current.name}`} />;
  }
  return (
    <div className="colour-stack">
      {product.colourways.map((c) => {
        if (!c.image) return null;
        const on = c.slug === current.slug;
        return (
          <Image
            key={c.slug}
            src={c.image}
            alt={on ? `${product.name} in ${c.name}` : ""}
            aria-hidden={!on}
            className={on ? "on" : ""}
            loading={eager ? "eager" : "lazy"}
            fetchPriority={on ? (eager ? "high" : undefined) : "low"}
            width={1122}
            height={1402}
            sizes={sizes}
          />
        );
      })}
    </div>
  );
}
