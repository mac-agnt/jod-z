"use client";
import Link from "next/link";
import { useEffect, useState, type CSSProperties, type KeyboardEvent } from "react";
import { formatPrice, type Product } from "@/lib/products";
import { stills } from "@/lib/media";
import { Arrow } from "./Button";

// Glass product card in the hero. Hovering a swatch previews that colourway;
// every link deep-links the PDP to the colour on show.
export function HeroCard({ product, initial }: { product: Product; initial?: string }) {
  const list = product.colourways;
  const [active, setActive] = useState(list.find((c) => c.slug === initial) ?? list[0]);
  const href = `/product/${product.slug}?colour=${active.slug}`;

  // Warm the colour renders so swatch previews swap instantly. Desktop only:
  // the card is hidden on small screens.
  useEffect(() => {
    if (!matchMedia("(min-width: 981px)").matches) return;
    const id = window.setTimeout(() => list.forEach((c) => { if (c.image) new Image().src = c.image; }), 3000);
    return () => window.clearTimeout(id);
  }, [list]);

  const onKey = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
    const d = e.key === "ArrowRight" || e.key === "ArrowDown" ? 1 : e.key === "ArrowLeft" || e.key === "ArrowUp" ? -1 : 0;
    if (!d) return;
    e.preventDefault();
    const j = (i + d + list.length) % list.length;
    setActive(list[j]);
    (e.currentTarget.parentElement?.children[j] as HTMLElement | undefined)?.focus();
  };

  return (
    <div className="hero-card">
      <Link href={href} className="hero-card-img" tabIndex={-1} aria-hidden="true">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={active.slug} src={active.image ?? stills.render} alt="" />
      </Link>
      <div className="hero-card-body">
        <Link href={href} className="hero-card-name">{product.name}</Link>
        <p className="hero-card-meta">
          <span aria-live="polite">{active.name}</span>, {formatPrice(product.price)}
        </p>
        <div className="hero-card-sw" role="radiogroup" aria-label="Colour">
          {list.map((c, i) => (
            <button
              key={c.slug}
              type="button"
              role="radio"
              aria-checked={c.slug === active.slug}
              aria-label={c.name}
              tabIndex={c.slug === active.slug ? 0 : -1}
              style={{ "--sw": c.hex } as CSSProperties}
              onClick={() => setActive(c)}
              onMouseEnter={() => setActive(c)}
              onKeyDown={(e) => onKey(e, i)}
            />
          ))}
        </div>
      </div>
      <Link href={href} className="hero-card-go" aria-label={`Shop ${product.name} in ${active.name}`}>
        <Arrow />
      </Link>
    </div>
  );
}
