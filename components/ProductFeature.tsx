"use client";
import { useState, type CSSProperties } from "react";
import { ArrowsClockwise, Truck } from "@phosphor-icons/react/dist/ssr";
import { formatPrice, type Product } from "@/lib/products";
import { ColourImage } from "./ColourImage";
import { Swatches } from "./Swatches";
import { Button } from "./Button";
import { Klarna } from "./Klarna";
import { Reveal } from "./Reveal";
import { RevealText } from "./RevealText";
import { Hotspots, spotsFor } from "./Hotspots";

// Homepage product module: studio render with feature hotspots on one side,
// name, price, colour picker and CTAs on the other. The panel's ambient glow
// takes on the selected colour.
export function ProductFeature({ product, flip = false, initial }: { product: Product; flip?: boolean; initial?: string }) {
  const [active, setActive] = useState(product.colourways.find((c) => c.slug === initial) ?? product.colourways[0]);
  const spots = active.image ? spotsFor[product.slug] : undefined;
  const sizes = product.sizes.length > 1 ? `${product.sizes[0]} to ${product.sizes[product.sizes.length - 1]}` : product.sizes[0];

  return (
    <article className={`pf ${flip ? "pf-flip" : ""}`} aria-labelledby={`${product.slug}-title`} style={{ "--sw": active.hex } as CSSProperties}>
      <Reveal variant="clip" className="pf-stage">
        <ColourImage product={product} active={active.slug} />
        {spots && <Hotspots spots={spots} />}
      </Reveal>

      <Reveal className="pf-info" stagger={80} delay={150}>
        <div className="pf-meta">
          <span>{product.colourways.length} {product.colourways.length === 1 ? "colour" : "colours"}</span>
          <span>Sizes {sizes}</span>
        </div>
        <RevealText as="h3" id={`${product.slug}-title`} className="serif pf-title" delay={260}>{product.name}</RevealText>
        <div className="pf-price">
          <strong>{formatPrice(product.price)}</strong>
          <span>Pay in 3 with <Klarna /></span>
        </div>
        <p className="pf-desc">{product.descriptor}</p>
        <div className="pf-picker">
          <div className="colour-row">
            <span className="label">Colour</span>
            <span className="colour-name" aria-live="polite">{active.name}</span>
          </div>
          <Swatches colourways={product.colourways} active={active} onChange={setActive} />
          <p className="pf-note">{active.note}</p>
        </div>
        <div className="pf-ctas">
          <Button href={`/product/${product.slug}?colour=${active.slug}`} variant="dark">Shop {product.short}</Button>
          <Button href="/sizing" variant="ghost-dark" arrow={false}>Size guide</Button>
        </div>
        <ul className="pf-assure">
          <li><Truck size={18} weight="light" aria-hidden="true" /> 1 to 3 day DPD delivery</li>
          <li><ArrowsClockwise size={18} weight="light" aria-hidden="true" /> Easy size exchanges</li>
        </ul>
      </Reveal>
    </article>
  );
}
