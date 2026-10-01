"use client";
import { useEffect, useMemo, useState } from "react";
import { formatPrice, getProduct, products, type Colourway } from "@/lib/products";
import { delivery, legPacks } from "@/lib/offer";
import { stills } from "@/lib/media";
import { useCart, LineThumb, lineLabel, type NewLine } from "./Cart";
import { Button } from "./Button";
import { Swatches } from "./Swatches";
import { ProductRender } from "./Render";
import { Icon } from "./Icon";
import { Klarna } from "./Klarna";

type Step = "look" | "upgrade" | "delivery" | "review";

/**
 * Buy now: a short, one-decision-per-screen flow before checkout.
 * Big yes, quiet no. Each offer is skippable in one tap.
 */
export function BuyNowFlow({ base, onClose }: { base: NewLine | null; onClose: () => void }) {
  const { addMany, setOpen } = useCart();
  const main = base ? getProduct(base.product) : undefined;
  const extra = products.find((p) => p.slug !== base?.product);

  const [step, setStep] = useState<Step>("look");
  const [lines, setLines] = useState<NewLine[]>([]);
  const [xColour, setXColour] = useState<Colourway | undefined>(extra?.colourways[0]);
  const [xSize, setXSize] = useState<string | null>(null);
  const [xHint, setXHint] = useState("");
  const [done, setDone] = useState(false);

  // Fresh flow each time Buy now is pressed
  useEffect(() => {
    if (!base) return;
    setLines([base]);
    setStep("look");
    setXColour(extra?.colourways[0]);
    setXSize(base.size && extra?.sizes.includes(base.size) ? base.size : null);
    setXHint("");
    setDone(false);
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); };
  }, [base, extra, onClose]);

  const legLine = lines.find((l) => l.product === base?.product);
  const nextPack = useMemo(() => {
    if (!legLine || main?.kind !== "legging") return undefined;
    return legPacks.find((p) => p.pairs === legLine.pairs + 1);
  }, [legLine, main]);

  const steps: Step[] = ["look", ...(nextPack || step === "upgrade" ? (["upgrade"] as Step[]) : []), "delivery", "review"];
  const idx = steps.indexOf(step);
  const go = (s: Step) => setStep(s);
  const afterLook = () => go(nextPack ? "upgrade" : "delivery");
  const total = lines.reduce((n, l) => n + l.price, 0);

  if (!base || !main) return null;

  const addExtra = () => {
    if (!extra || !xColour) return;
    if (!xSize) { setXHint("Choose a size to add it."); return; }
    setLines((ls) => [...ls, { product: extra.slug, colour: xColour.slug, size: xSize, pairs: 1, price: extra.price }]);
    afterLook();
  };

  const upgrade = () => {
    if (!nextPack) return;
    setLines((ls) => ls.map((l) => (l === legLine ? { ...l, pairs: nextPack.pairs, price: nextPack.price } : l)));
    go("delivery");
  };

  const finish = () => {
    addMany(lines);
    setDone(true);
  };

  const upgradeCost = nextPack && legLine ? nextPack.price - legLine.price : 0;
  const upgradeSave = nextPack && legLine ? main.price * nextPack.pairs - nextPack.price : 0;

  return (
    <div className="flow-root" role="dialog" aria-modal="true" aria-label="Buy now">
      <div className="flow-scrim" onClick={onClose} />
      <div className="flow">
        <header className="flow-head">
          <ol className="flow-steps" aria-label="Progress">
            {steps.map((s, n) => <li key={s} className={n <= idx ? "on" : ""} aria-current={n === idx ? "step" : undefined} />)}
          </ol>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
        </header>

        {done ? (
          <section className="flow-body flow-done" key="done">
            <span className="flow-ico"><Icon name="check" size={40} /></span>
            <h2 className="serif flow-title">Ready for checkout.</h2>
            <p className="muted">{delivery.freeMessage}. Your order arrives in {delivery.window.toLowerCase()}.</p>
            <p className="small muted">Secure checkout connects to Shopify at launch.</p>
            <div className="flow-ctas">
              <Button variant="gold" onClick={() => { onClose(); setOpen(true); }}>View bag</Button>
            </div>
          </section>
        ) : step === "look" && extra && xColour ? (
          <section className="flow-body" key="look">
            <p className="flow-kicker">Riders who bought this also added</p>
            <h2 className="serif flow-title">Complete the look.</h2>
            <div className="flow-offer">
              <div className="flow-offer-img">
                {xColour.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={xColour.image} alt={`${extra.name} in ${xColour.name}`} />
                ) : (
                  <ProductRender kind={extra.kind} hex={xColour.hex} title={`${extra.name} in ${xColour.name}`} />
                )}
              </div>
              <div className="flow-offer-body">
                <p className="flow-offer-name">{extra.name}</p>
                <p className="muted small">{extra.descriptor}</p>
                <p className="flow-price">{formatPrice(extra.price)}</p>
                <div className="colour-row"><span className="label">Colour</span><span className="colour-name">{xColour.name}</span></div>
                <Swatches colourways={extra.colourways} active={xColour} onChange={setXColour} size="md" />
                <div className="colour-row" style={{ marginTop: 18 }}><span className="label">Size</span></div>
                <div className="sizes" style={{ gridTemplateColumns: `repeat(${extra.sizes.length}, 1fr)` }} role="radiogroup" aria-label="Size">
                  {extra.sizes.map((s) => (
                    <button key={s} type="button" role="radio" aria-checked={xSize === s} className="size" onClick={() => { setXSize(s); setXHint(""); }}>{s}</button>
                  ))}
                </div>
                <p className="hint" role="alert">{xHint}</p>
              </div>
            </div>
            <div className="flow-ctas">
              <Button variant="gold" onClick={addExtra}>Add {extra.short.toLowerCase()}, {formatPrice(extra.price)}</Button>
              <button type="button" className="flow-no" onClick={afterLook}>No thanks, continue</button>
            </div>
          </section>
        ) : step === "upgrade" && nextPack && legLine ? (
          <section className="flow-body" key="upgrade">
            <p className="flow-kicker">Wait, before you go</p>
            <h2 className="serif flow-title">Are you sure you only want {legLine.pairs === 1 ? "one pair" : `${legLine.pairs} pairs`}?</h2>
            <div className="flow-upgrade">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stills.seat} alt="Rider in the saddle wearing Jod-Z leggings" />
              <div>
                <p className="flow-big">
                  Make it {nextPack.pairs} pairs for <strong>{formatPrice(upgradeCost)}</strong> more
                </p>
                <p className="muted">One for the yard, one for the ring. You save {formatPrice(upgradeSave)} on the pack.</p>
                <ul className="flow-checks">
                  <li><Icon name="check" size={16} /> Same colour and size: {lineLabel(legLine).detail.split(", ").slice(0, 2).join(", ")}</li>
                  <li><Icon name="check" size={16} /> {nextPack.label} for {formatPrice(nextPack.price)} instead of {formatPrice(main.price * nextPack.pairs)}</li>
                  <li><Icon name="truck" size={16} /> Still free, still {delivery.window.toLowerCase()}</li>
                </ul>
              </div>
            </div>
            <div className="flow-ctas">
              <Button variant="gold" onClick={upgrade}>Yes, make it {nextPack.pairs} pairs</Button>
              <button type="button" className="flow-no" onClick={() => go("delivery")}>No, I only want {legLine.pairs === 1 ? "one" : legLine.pairs}</button>
            </div>
          </section>
        ) : step === "delivery" ? (
          <section className="flow-body" key="delivery">
            <p className="flow-kicker gold"><Icon name="check" size={16} /> {delivery.freeMessage}</p>
            <h2 className="serif flow-title">Delivery.</h2>
            <label className="flow-option on">
              <input type="radio" name="ship" defaultChecked />
              <span className="flow-option-ico"><Icon name="truck" size={24} /></span>
              <span>
                <strong>Tracked {delivery.carrier}</strong>
                <span className="muted small">{delivery.window}. Ireland, the UK and Europe.</span>
              </span>
              <span className="gold">Free</span>
            </label>
            <p className="small muted pay-line">Pay in 3, interest free with <Klarna /></p>
            <div className="flow-ctas">
              <Button variant="gold" onClick={() => go("review")}>Continue</Button>
            </div>
          </section>
        ) : (
          <section className="flow-body" key="review">
            <h2 className="serif flow-title">Your order.</h2>
            <ul className="drawer-lines flow-lines">
              {lines.map((l) => {
                const { name, detail } = lineLabel(l);
                return (
                  <li key={`${l.product}-${l.colour}-${l.size}-${l.pairs}`} className="line">
                    <LineThumb product={l.product} colour={l.colour} />
                    <div><p className="line-name">{name}</p><p className="muted">{detail}</p></div>
                    <span>{formatPrice(l.price)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="flow-total">
              <div className="row"><span className="label">Delivery</span><span className="gold">Free</span></div>
              <div className="row"><span className="label">Total</span><span className="flow-big">{formatPrice(total)}</span></div>
              <p className="small muted pay-line">Or 3 payments of {formatPrice(Math.ceil((total / 3) * 100) / 100)} with <Klarna /></p>
            </div>
            <div className="flow-ctas">
              <Button variant="gold" onClick={finish}>Checkout securely</Button>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
