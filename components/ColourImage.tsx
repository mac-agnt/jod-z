import type { Product } from "@/lib/products";
import { ProductRender } from "./Render";

// Every colourway image stacked; the active one crossfades in, so a swatch
// click feels like the same garment changing colour, not a new page.
export function ColourImage({ product, active, eager = false }: { product: Product; active: string; eager?: boolean }) {
  const current = product.colourways.find((c) => c.slug === active) ?? product.colourways[0];
  if (!current.image) {
    return <ProductRender key={current.slug} kind={product.kind} hex={current.hex} className="fade-swap" title={`${product.name} in ${current.name}`} />;
  }
  return (
    <div className="colour-stack">
      {product.colourways.map((c) =>
        c.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={c.slug}
            src={c.image}
            alt={c.slug === current.slug ? `${product.name} in ${c.name}` : ""}
            aria-hidden={c.slug !== current.slug}
            className={c.slug === current.slug ? "on" : ""}
            loading={eager || c.slug === current.slug ? "eager" : "lazy"}
            decoding="async"
            width={1122}
            height={1402}
          />
        ) : null
      )}
    </div>
  );
}
