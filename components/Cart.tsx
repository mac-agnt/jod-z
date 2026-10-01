"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { formatPrice, getProduct } from "@/lib/products";
import { delivery } from "@/lib/offer";
import { ProductRender } from "./Render";
import { Button } from "./Button";
import { Icon } from "./Icon";
import { Klarna } from "./Klarna";

/** One bag line. `pairs` is the pack size; `price` is the pack price. */
export type Line = { product: string; colour: string; size: string; pairs: number; price: number; qty: number };
export type NewLine = Omit<Line, "qty">;

type Ctx = {
  lines: Line[];
  count: number;
  total: number;
  open: boolean;
  setOpen: (o: boolean) => void;
  add: (l: NewLine, opts?: { open?: boolean }) => void;
  addMany: (ls: NewLine[]) => void;
  setQty: (i: number, qty: number) => void;
};

const CartCtx = createContext<Ctx | null>(null);

export function useCart() {
  const c = useContext(CartCtx);
  if (!c) throw new Error("useCart outside CartProvider");
  return c;
}

const same = (a: NewLine, b: NewLine) => a.product === b.product && a.colour === b.colour && a.size === b.size && a.pairs === b.pairs;

function merge(prev: Line[], l: NewLine): Line[] {
  const i = prev.findIndex((p) => same(p, l));
  if (i === -1) return [...prev, { ...l, qty: 1 }];
  return prev.map((p, j) => (j === i ? { ...p, qty: p.qty + 1 } : p));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);

  // Keep the bag across page loads for this visit
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("jz-bag");
      if (saved) setLines(JSON.parse(saved) as Line[]);
    } catch {}
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { sessionStorage.setItem("jz-bag", JSON.stringify(lines)); } catch {}
  }, [lines, ready]);

  const add = useCallback((l: NewLine, opts?: { open?: boolean }) => {
    setLines((prev) => merge(prev, l));
    if (opts?.open !== false) setOpen(true);
  }, []);

  const addMany = useCallback((ls: NewLine[]) => {
    setLines((prev) => ls.reduce(merge, prev));
  }, []);

  const setQty = useCallback((i: number, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((_, j) => j !== i) : prev.map((p, j) => (j === i ? { ...p, qty } : p))));
  }, []);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty * l.pairs, 0),
      total: lines.reduce((n, l) => n + l.price * l.qty, 0),
      open,
      setOpen,
      add,
      addMany,
      setQty,
    }),
    [lines, open, add, addMany, setQty]
  );

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}

export function LineThumb({ product, colour }: { product: string; colour: string }) {
  const p = getProduct(product);
  const c = p?.colourways.find((x) => x.slug === colour);
  if (!p || !c) return null;
  return (
    <div className="line-thumb">
      {c.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image} alt={`${p.name}, ${c.name}`} />
      ) : (
        <ProductRender kind={p.kind} hex={c.hex} title={`${p.name}, ${c.name}`} />
      )}
    </div>
  );
}

export const lineLabel = (l: NewLine) => {
  const p = getProduct(l.product);
  const c = p?.colourways.find((x) => x.slug === l.colour);
  return { name: p?.name ?? "", detail: `${c?.name ?? ""}, ${l.size}${l.pairs > 1 ? `, ${l.pairs} pairs` : ""}` };
};

function CartDrawer() {
  const { lines, open, setOpen, setQty, total } = useCart();
  const [note, setNote] = useState(false);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, setOpen]);

  return (
    <div className={`drawer-root ${open ? "open" : ""}`} aria-hidden={!open}>
      <div className="drawer-scrim" onClick={() => setOpen(false)} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your bag">
        <div className="drawer-head">
          <span className="label">Your bag</span>
          <button type="button" className="icon-btn" onClick={() => setOpen(false)} aria-label="Close bag" tabIndex={open ? 0 : -1}>
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="drawer-empty">
            <p className="serif" style={{ fontSize: 28 }}>Your bag is empty.</p>
            <p className="muted">Eleven colours of the legging are waiting.</p>
            <Button href="/product/the-jod-z" variant="dark">Shop leggings</Button>
          </div>
        ) : (
          <>
            <p className="drawer-free"><Icon name="check" size={16} /> {delivery.freeMessage}</p>
            <ul className="drawer-lines">
              {lines.map((l, i) => {
                const { name, detail } = lineLabel(l);
                return (
                  <li key={`${l.product}-${l.colour}-${l.size}-${l.pairs}`} className="line">
                    <LineThumb product={l.product} colour={l.colour} />
                    <div>
                      <p className="line-name">{name}</p>
                      <p className="muted">{detail}</p>
                      <div className="qty">
                        <button type="button" onClick={() => setQty(i, l.qty - 1)} aria-label="Decrease quantity">−</button>
                        <span aria-live="polite">{l.qty}</span>
                        <button type="button" onClick={() => setQty(i, l.qty + 1)} aria-label="Increase quantity">+</button>
                      </div>
                    </div>
                    <span>{formatPrice(l.price * l.qty)}</span>
                  </li>
                );
              })}
            </ul>
            <div className="drawer-foot">
              <div className="row"><span className="label">Subtotal</span><span>{formatPrice(total)}</span></div>
              <div className="row"><span className="label">Delivery</span><span className="gold">Free</span></div>
              <p className="muted small pay-line"><span>Pay in 3 with</span> <Klarna /> <span>or Apple Pay, Google Pay, PayPal.</span></p>
              <Button variant="gold" block onClick={() => setNote(true)}>Checkout securely</Button>
              {note && <p className="small muted" role="status">Checkout connects to Shopify at launch.</p>}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
