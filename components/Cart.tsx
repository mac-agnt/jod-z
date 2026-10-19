"use client";
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import Image from "next/image";
import { formatPrice, getProduct } from "@/lib/products";
import { delivery } from "@/lib/offer";
import { checkoutAction } from "@/lib/commerce/actions";
import { getAttribution, referralCode, track } from "@/lib/analytics/client";
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
  clear: () => void;
  /** Sends the bag (plus any extra lines) to checkout. */
  checkout: (extra?: NewLine[]) => Promise<void>;
  pending: boolean;
  error: string;
  code?: string;
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

const BAG = "jz-bag-v2";
const BAG_DAYS = 14;
// Checkout happens on Shopify, which cannot tell this site the order went
// through. A bag that went to checkout over an hour ago is treated as bought.
const CHECKED_OUT_MINUTES = 60;
type Saved = { lines: Line[]; at: number; checkoutAt?: number };

const sum = (ls: Line[]) => ls.reduce((n, l) => n + l.price * l.qty, 0);

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<Line[]>([]);
  const [open, setOpen] = useState(false);
  const [ready, setReady] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const [code, setCode] = useState<string>();

  // Keep the bag across visits on this device for two weeks
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(BAG) ?? "null") as Saved | null;
      const fresh = saved && Date.now() - saved.at < BAG_DAYS * 86_400_000;
      const bought = saved?.checkoutAt && Date.now() - saved.checkoutAt > CHECKED_OUT_MINUTES * 60_000;
      if (fresh && !bought) setLines(saved.lines);
    } catch {}
    setCode(referralCode());
    if (new URLSearchParams(window.location.search).get("bag") === "open") setOpen(true);
    setReady(true);
  }, []);
  useEffect(() => {
    if (!ready) return;
    try { localStorage.setItem(BAG, JSON.stringify({ lines, at: Date.now() } satisfies Saved)); } catch {}
  }, [lines, ready]);

  const add = useCallback((l: NewLine, opts?: { open?: boolean }) => {
    setLines((prev) => merge(prev, l));
    setError("");
    track("add_to_cart", { product: l.product, colour: l.colour, size: l.size, pairs: l.pairs, value: l.price });
    if (opts?.open !== false) setOpen(true);
  }, []);

  const addMany = useCallback((ls: NewLine[]) => {
    setLines((prev) => ls.reduce(merge, prev));
  }, []);

  const setQty = useCallback((i: number, qty: number) => {
    setLines((prev) => (qty <= 0 ? prev.filter((_, j) => j !== i) : prev.map((p, j) => (j === i ? { ...p, qty: Math.min(qty, 20) } : p))));
  }, []);

  const clear = useCallback(() => {
    setLines([]);
    try { localStorage.removeItem(BAG); } catch {}
  }, []);

  const checkout = useCallback(async (extra: NewLine[] = []) => {
    const all = extra.reduce(merge, lines);
    if (extra.length) setLines(all);
    if (all.length === 0) return;
    setPending(true);
    setError("");
    track("begin_checkout", { value: sum(all) });
    try {
      const r = await checkoutAction(all.map(({ product, colour, size, pairs, qty }) => ({ product, colour, size, pairs, qty })), getAttribution());
      if (r.ok) {
        try { localStorage.setItem(BAG, JSON.stringify({ lines: all, at: Date.now(), checkoutAt: Date.now() } satisfies Saved)); } catch {}
        window.location.assign(r.url);
        return;
      }
      setError(r.error);
    } catch {
      setError("Checkout is unavailable right now. Please try again in a minute.");
    }
    setPending(false);
  }, [lines]);

  const value = useMemo(
    () => ({
      lines,
      count: lines.reduce((n, l) => n + l.qty * l.pairs, 0),
      total: sum(lines),
      open,
      setOpen,
      add,
      addMany,
      setQty,
      clear,
      checkout,
      pending,
      error,
      code,
    }),
    [lines, open, add, addMany, setQty, clear, checkout, pending, error, code]
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
        <Image src={c.image} alt={`${p.name}, ${c.name}`} width={1122} height={1402} sizes="84px" />
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
  const { lines, open, setOpen, setQty, total, checkout, pending, error, code } = useCart();
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
              {code && <p className="small drawer-code"><Icon name="check" size={14} /> Code {code} is applied at checkout.</p>}
              <p className="muted small pay-line"><span>Pay in 3 with</span> <Klarna /> <span>or Apple Pay, Google Pay, PayPal.</span></p>
              <Button variant="gold" block onClick={() => checkout()} disabled={pending}>{pending ? "Opening secure checkout" : "Checkout securely"}</Button>
              {error && <p className="small drawer-error" role="alert">{error}</p>}
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
