"use client";
import Link from "next/link";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState, type CSSProperties } from "react";
import { ProductRender } from "@/components/Render";
import { ColourImage } from "@/components/ColourImage";
import { Gallery, type Slide } from "@/components/Gallery";
import { breechStills, stills } from "@/lib/media";
import { Swatches } from "@/components/Swatches";
import { Arrow, Button } from "@/components/Button";
import { SizeGuide, type SizeTab } from "@/components/SizeGuide";
import { useCart, type NewLine } from "@/components/Cart";
import { PackPicker } from "@/components/PackPicker";
import { TrustRow } from "@/components/TrustRow";
import { BuyNowFlow } from "@/components/BuyNowFlow";
import { Klarna } from "@/components/Klarna";
import { Reveal } from "@/components/Reveal";
import { RevealText } from "@/components/RevealText";
import { legPacks, type Pack } from "@/lib/offer";
import { formatPrice, getProduct, isLight, products, reviews, sizeLabel, type Product, type ProductKind } from "@/lib/products";
import { LOW_STOCK, type Availability } from "@/lib/commerce/types";
import { track } from "@/lib/analytics/client";

const guideTab: Record<ProductKind, SizeTab> = { legging: "Leggings", breech: "Breeches" };
// Full bleed on phones, a column of at most 680px beside the buy box above 980px.
const GALLERY_SIZES = "(max-width: 980px) 100vw, 680px";

export function PDP({ slug, initialColour }: { slug: string; initialColour: string }) {
  const product = getProduct(slug) as Product;
  const [colour, setColour] = useState(product.colourways.find((c) => c.slug === initialColour) ?? product.colourways[0]);
  const [size, setSize] = useState<string | null>(null);
  const [hint, setHint] = useState("");
  const [guide, setGuide] = useState(false);
  const [sticky, setSticky] = useState(false);
  const packs = product.kind === "legging" ? legPacks : null;
  const [pack, setPack] = useState<Pack>(packs ? packs[0] : { pairs: 1, price: product.price, label: "1" });
  const [flow, setFlow] = useState<NewLine | null>(null);
  const [eta, setEta] = useState("");
  const [stock, setStock] = useState<Availability>({});
  const viewed = useRef("");

  // Live stock per colour and size. Until it arrives every size is buyable;
  // Shopify checkout is the final word on stock either way.
  useEffect(() => {
    let live = true;
    fetch(`/api/availability?product=${slug}`).then((r) => (r.ok ? r.json() : {})).then((a: Availability) => { if (live) setStock(a); }).catch(() => {});
    if (viewed.current !== slug) { viewed.current = slug; track("view_item", { product: slug, value: product.price }); }
    return () => { live = false; };
  }, [slug, product.price]);
  const stockOf = (s: string) => stock[colour.slug]?.[s];
  const soldOut = (s: string) => stockOf(s)?.available === false;
  const allGone = product.sizes.every(soldOut);
  const left = size ? stockOf(size)?.quantity : undefined;
  const pickSize = (s: string) => {
    if (soldOut(s)) { setHint(`${s} is sold out in ${colour.name}. Try another size or colour.`); return; }
    setSize(s);
    setHint("");
  };

  // Delivery window in working days, computed client-side to avoid SSR drift
  useEffect(() => {
    const add = (d: Date, n: number) => { const x = new Date(d); while (n > 0) { x.setDate(x.getDate() + 1); if (x.getDay() % 6 !== 0) n--; } return x; };
    const f = (d: Date) => d.toLocaleDateString("en-IE", { weekday: "short", day: "numeric", month: "short" });
    const now = new Date();
    setEta(`${f(add(now, 1))} and ${f(add(now, 3))}`);
  }, []);
  const ctaRef = useRef<HTMLDivElement>(null);
  const { add } = useCart();
  // Photographed products lead the cross-sell
  const others = products
    .filter((p) => p.slug !== product.slug)
    .sort((a, b) => Number(!a.colourways[0].image) - Number(!b.colourways[0].image));

  useEffect(() => {
    const el = ctaRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setSticky(!e.isIntersecting && e.boundingClientRect.top < 0));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const url = new URL(window.location.href);
    url.searchParams.set("colour", colour.slug);
    window.history.replaceState(window.history.state, "", url);
  }, [colour]);

  // A size that sells out in the newly picked colour is cleared.
  useEffect(() => {
    if (size && stock[colour.slug]?.[size]?.available === false) setSize(null);
  }, [colour, size, stock]);

  useEffect(() => {
    if (!guide) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setGuide(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [guide]);

  const selection = (): NewLine | null => {
    if (!size || soldOut(size)) {
      setHint(allGone ? `${colour.name} is sold out. Choose another colour.` : "Choose a size first.");
      document.getElementById("size-group")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return null;
    }
    setHint("");
    return { product: product.slug, colour: colour.slug, size, pairs: pack.pairs, price: pack.price };
  };
  const addToBag = () => { const l = selection(); if (l) add(l); };
  const closeFlow = useCallback(() => setFlow(null), []);
  const buyNow = () => { const l = selection(); if (l) setFlow(l); };

  const tone = isLight(colour.hex) ? "stage-dark" : "";
  // Gallery stills are 1122x1402 fabric close-ups, kept at quality 85. Slides
  // after the first start hidden, so they load at low priority behind the
  // colour image on show.
  const photo = (src: string, alt: string) => (
    <Image className="pg-img" src={src} alt={alt} width={1122} height={1402} sizes={GALLERY_SIZES} quality={85} fetchPriority="low" draggable={false} />
  );
  const thumb = (src: string) => (
    <Image className="pg-img" src={src} alt="" width={1122} height={1402} sizes="68px" draggable={false} />
  );
  const colourView = colour.image ? (
    <div className="pg-colour"><ColourImage product={product} active={colour.slug} sizes={GALLERY_SIZES} eager /></div>
  ) : (
    <div className={`pg-render stage ${tone}`}><ProductRender kind={product.kind} hex={colour.hex} title={`${product.name} in ${colour.name}`} className="fade-swap" /></div>
  );
  const slides: Slide[] =
    product.kind === "legging"
      ? [
          { key: "colour", label: colour.name, info: "Fully opaque 4-way stretch. No see-through, no sag.", view: colourView, thumb: colour.image ? thumb(colour.image) : colourView },
          { key: "pocket", label: "Phone pocket", info: "Deep thigh pocket for your phone or treats, with the embossed Jod-Z mark.", view: photo(stills.pocket, "Phone pocket and embossed Jod-Z logo"), thumb: thumb(stills.pocket) },
          { key: "seat", label: "In the saddle", info: "High waist that stays put through every stride.", view: photo(stills.seat, "Rider in the saddle wearing Jod-Z leggings"), thumb: thumb(stills.seat) },
          { key: "flat", label: "Construction", info: "Shaped knee panel with silicone grip and flat, chafe-free seams.", view: photo(stills.flatlay, "Jod-Z leggings laid flat on marble"), thumb: thumb(stills.flatlay) },
          { key: "door", label: "Yard to ring", info: "Smart enough for the show, tough enough for mucking out.", view: photo(stills.door, "Young rider in Jod-Z leggings leading her horse from the stable"), thumb: thumb(stills.door) },
          { key: "sunset", label: "Breathable", info: "Quick-dry fabric for long days and hot schooling sessions.", view: photo(stills.sunset, "Rider cantering at sunset in Jod-Z leggings"), thumb: thumb(stills.sunset) },
        ]
      : [
          { key: "colour", label: colour.name, info: colour.note, view: colourView, thumb: colour.image ? thumb(colour.image) : colourView },
          { key: "waist", label: "Adjustable waistband", info: "Fine-tune the fit at the waist, with a zipped pocket on each hip.", view: photo(breechStills.detail, "Close up of the Monarch Navy waistband, zipped hip pocket and tan suede knee panel"), thumb: thumb(breechStills.detail) },
          { key: "flat", label: "Suede knee panels", info: "Luxury suede for comfort and durability in the saddle.", view: photo(breechStills.flat, "The Eclipse Black breech laid flat on marble"), thumb: thumb(breechStills.flat) },
        ];


  return (
    <main className="pdp">
      <div className="wrap pdp-grid">
        <div className="pdp-media">
          <Gallery slides={slides} resetKey={colour.slug} />
        </div>

        <Reveal className="buy" load stagger={60} delay={140}>
          <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span>/</span><span>{product.short}</span></nav>
          <RevealText as="h1" className="serif buy-title" load delay={200} step={60}>{product.name}</RevealText>
          <div className="buy-meta">
            <span className="price">{formatPrice(pack.price)}{pack.pairs > 1 && <span className="muted small"> for {pack.pairs} pairs</span>}</span>
            <a href="#reviews" className="rating"><span className="stars">★★★★★</span><span className="muted">Rider reviews</span></a>
          </div>
          <p className="buy-desc">{product.descriptor}</p>

          <div className="opt">
            <div className="colour-row"><span className="label">Colour</span><span className="colour-name" aria-live="polite">{colour.name}</span></div>
            <Swatches colourways={product.colourways} active={colour} onChange={(c) => { setColour(c); track("select_colour", { product: product.slug, colour: c.slug }); }} size="md" />
          </div>

          {packs && (
            <div className="opt">
              <div className="colour-row"><span className="label">Choose your pack</span><span className="colour-name">{pack.label}</span></div>
              <PackPicker packs={packs} value={pack.pairs} onChange={setPack} unit={product.price} />
            </div>
          )}

          <div className="opt" id="size-group">
            <div className="colour-row">
              <span className="label">Size</span>
              <span className="size-hint">{product.sizeHint ?? "True to size."} <button type="button" className="text-btn" onClick={() => setGuide(true)}>Size guide</button></span>
            </div>
            <div className="sizes" role="radiogroup" aria-label="Size" style={{ gridTemplateColumns: `repeat(${product.sizes.length}, 1fr)` }}>
              {product.sizes.map((s) => (
                <button key={s} type="button" role="radio" aria-checked={size === s} aria-disabled={soldOut(s) || undefined} aria-label={`${sizeLabel(product, s) ?? s}${soldOut(s) ? ", sold out" : ""}`} className="size" onClick={() => pickSize(s)}>{s}</button>
              ))}
            </div>
            {left !== undefined && left > 0 && left <= LOW_STOCK && <p className="size-low">Only {left} left in {size}.</p>}
            <p className="hint" role="alert">{hint || (allGone ? `${colour.name} is sold out for now.` : "")}</p>
          </div>

          <div ref={ctaRef} className="buy-ctas">
            <Button variant="gold" block onClick={addToBag}>Add to bag, {formatPrice(pack.price)}</Button>
            <Button variant="light" block arrow={false} onClick={buyNow}>Buy now</Button>
          </div>
          {eta && <p className="eta"><span className="eta-dot" aria-hidden="true" />Order now, arrives between <strong>{eta}</strong></p>}
          <p className="small muted pay-line center">Pay in 3 interest free with <Klarna /></p>
          <TrustRow saddle={product.saddle} />

          <div className="acc">
            <details open>
              <summary><span className="label">Fit</span></summary>
              <div className="body">{product.fit} <button type="button" className="text-btn" onClick={() => setGuide(true)}>Open size guide</button></div>
            </details>
            <details>
              <summary><span className="label">Materials and features</span></summary>
              <div className="body"><ul>{product.features.map((f) => <li key={f}>{f}</li>)}</ul></div>
            </details>
            <details>
              <summary><span className="label">Care</span></summary>
              <div className="body">{product.care}</div>
            </details>
            <details>
              <summary><span className="label">Delivery and returns</span></summary>
              <div className="body">Tracked DPD delivery to Ireland, the UK and across Europe, usually in 1 to 3 working days. Wrong size? Request a return within 30 days of delivery. <Link href="/delivery-returns" className="text-btn">Delivery and returns</Link></div>
            </details>
          </div>
        </Reveal>
      </div>

      <section className="section pdp-reviews" id="reviews" aria-labelledby="rev-title">
        <div className="wrap reviews">
          <div>
            <RevealText as="h2" id="rev-title" className="serif">What riders say.</RevealText>
            <Reveal as="p" className="muted" delay={260}>{product.kind === "legging" ? "Selected reviews, all colours." : "Selected reviews from across the range."}</Reveal>
          </div>
          <Reveal stagger={110}>
            {reviews.map((r) => (
              <blockquote className="review" key={r.name}>
                <div className="stars" aria-label="5 out of 5 stars">★★★★★</div>
                <p className="serif">&ldquo;{r.quote}&rdquo;</p>
                <footer className="label muted">{r.name}, {r.role}</footer>
              </blockquote>
            ))}
          </Reveal>
        </div>
      </section>

      {others.length > 0 && (
        <section className="section cross" aria-labelledby="more-title">
          <div className="wrap">
            <RevealText as="h2" id="more-title" className="serif more-title">More from Jod-Z.</RevealText>
            <Reveal className="more-grid" stagger={120} delay={120}>
              {others.map((p) => {
                const lead = p.colourways[0];
                return (
                  <article key={p.slug} className="more-card">
                    <div className={`more-img stage ${lead.image ? "stage-photo" : ""}`}>
                      {lead.image ? (
                        <Image src={lead.image} alt="" width={1122} height={1402} sizes="(max-width: 860px) 100vw, (max-width: 1520px) 45vw, 700px" />
                      ) : (
                        <ProductRender kind={p.kind} hex={p.colourways[1]?.hex ?? lead.hex} title="" />
                      )}
                    </div>
                    <div className="more-body">
                      <span className="label muted">{p.colourways.length} colours, {formatPrice(p.price)}</span>
                      <h3 className="serif"><Link href={`/product/${p.slug}`} className="more-link">{p.name}</Link></h3>
                      <p className="muted small">{p.descriptor}</p>
                      <div className="more-dots" aria-hidden="true">
                        {p.colourways.map((c) => <span key={c.slug} style={{ "--sw": c.hex } as CSSProperties} />)}
                      </div>
                      <span className="more-go" aria-hidden="true">View {p.short.toLowerCase()} <Arrow /></span>
                    </div>
                  </article>
                );
              })}
            </Reveal>
          </div>
        </section>
      )}

      <div className={`sticky-cta ${sticky ? "show" : ""}`} aria-hidden={!sticky}>
        <div className="wrap sticky-inner">
          <div className="sticky-meta">
            <span className="dot" style={{ "--sw": colour.hex } as CSSProperties} />
            <span><span className="hide-sm">{product.name}, </span>{colour.name}{size ? `, ${size}` : ""}</span>
          </div>
          <div className="sticky-sizes hide-sm" role="radiogroup" aria-label="Size">
            {product.sizes.map((s) => (
              <button key={s} type="button" role="radio" aria-checked={size === s} aria-disabled={soldOut(s) || undefined} aria-label={`${sizeLabel(product, s) ?? s}${soldOut(s) ? ", sold out" : ""}`} className="size size-sm" tabIndex={sticky ? 0 : -1} onClick={() => pickSize(s)}>{s}</button>
            ))}
          </div>
          <Button variant="gold" onClick={size ? addToBag : () => setGuide(true)}>{size ? `Add, ${formatPrice(pack.price)}` : "Choose size"}</Button>
        </div>
      </div>

      <div className={`drawer-root ${guide ? "open" : ""}`} aria-hidden={!guide}>
        <div className="drawer-scrim" onClick={() => setGuide(false)} />
        <aside className="drawer drawer-wide" role="dialog" aria-modal="true" aria-label="Size guide">
          <div className="drawer-head">
            <span className="label">Size guide</span>
            <button type="button" className="icon-btn" onClick={() => setGuide(false)} aria-label="Close size guide">
              <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
            </button>
          </div>
          <div className="drawer-body">
            <SizeGuide initial={guideTab[product.kind]} />
            <div className="drawer-pick">
              <span className="label">Select your size</span>
              <div className="sizes" style={{ gridTemplateColumns: `repeat(${product.sizes.length}, 1fr)` }}>
                {product.sizes.map((s) => (
                  <button key={s} type="button" aria-pressed={size === s} aria-disabled={soldOut(s) || undefined} aria-label={`${sizeLabel(product, s) ?? s}${soldOut(s) ? ", sold out" : ""}`} className="size" onClick={() => { pickSize(s); if (!soldOut(s)) setGuide(false); }}>{s}</button>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
      <BuyNowFlow base={flow} onClose={closeFlow} />
    </main>
  );
}
