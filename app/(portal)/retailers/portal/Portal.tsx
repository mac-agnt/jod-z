"use client";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { ArrowRight, ArrowsClockwise, CheckCircle, Minus, Plus, ShoppingBag, SignOut, Tag, TrendDown, TrendUp, Truck } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";
import { ProductRender } from "@/components/Render";
import { basketTotals, casePrice, tradeRules, type TradeItem, type TradeOrder } from "@/lib/trade";
import { placeTradeOrder } from "@/lib/portal/actions";
import { signOutAction } from "@/lib/auth/actions";

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const day = (iso: string) => new Date(iso).toLocaleDateString("en-IE", { day: "numeric", month: "short", year: "numeric" });
const STATUS: Record<TradeOrder["status"], string> = { submitted: "Processing", confirmed: "Confirmed", shipped: "In transit", delivered: "Delivered", cancelled: "Cancelled" };

function Thumb({ t, size = "md" }: { t: TradeItem; size?: "sm" | "md" | "lg" }) {
  return (
    <div className={`tp-thumb tp-thumb-${size}`}>
      {t.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={t.image} alt={`${t.name} in ${t.colourName}`} loading="lazy" />
      ) : (
        <ProductRender kind={t.kind} hex={t.hex} title={`${t.name} in ${t.colourName}`} />
      )}
    </div>
  );
}

function Stepper({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  return (
    <div className="tp-step" role="group" aria-label={`${label} cases`}>
      <button type="button" onClick={() => onChange(Math.max(0, value - 1))} aria-label="One case fewer"><Minus size={14} /></button>
      <span aria-live="polite">{value}</span>
      <button type="button" onClick={() => onChange(value + 1)} aria-label="One case more"><Plus size={14} /></button>
    </div>
  );
}

/** Banner art after Apple's dark ribbon wallpapers: layered rounded slabs,
 *  each edge catching a thin line of light. */
function BannerArt() {
  return (
    <div className="tp-aura" aria-hidden="true">
      <svg className="tp-art" viewBox="0 0 1600 420" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="tp-slab" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#1c1a18" />
            <stop offset=".55" stopColor="#100f0e" />
            <stop offset="1" stopColor="#0a0909" />
          </linearGradient>
          <linearGradient id="tp-rim0" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#f6e6cc" stopOpacity="0" />
            <stop offset=".35" stopColor="#f6e6cc" stopOpacity="1" />
            <stop offset=".6" stopColor="#f6e6cc" stopOpacity=".25" />
            <stop offset="1" stopColor="#f6e6cc" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="tp-rim1" x1="1" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ffffff" stopOpacity="0" />
            <stop offset=".45" stopColor="#ffffff" stopOpacity=".95" />
            <stop offset=".75" stopColor="#ffffff" stopOpacity=".15" />
            <stop offset="1" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
          <filter id="tp-glow" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="6" /></filter>
          <radialGradient id="tp-light" cx="72%" cy="20%" r="70%">
            <stop offset="0" stopColor="#3a3027" stopOpacity=".55" />
            <stop offset="1" stopColor="#0b0a0a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="1600" height="420" fill="#0b0a0a" />
        <rect width="1600" height="420" fill="url(#tp-light)" />
      <g>
        <rect x="640" y="-260" width="1100" height="380" rx="190" fill="url(#tp-slab)" />
        <rect x="640" y="-260" width="1100" height="380" rx="190" fill="none" stroke="url(#tp-rim0)" strokeWidth="10" filter="url(#tp-glow)" opacity=".8" />
        <rect x="640" y="-260" width="1100" height="380" rx="190" fill="none" stroke="url(#tp-rim0)" strokeWidth="1.6" />
      </g>
      <g>
        <rect x="880" y="-60" width="900" height="300" rx="150" fill="url(#tp-slab)" />
        <rect x="880" y="-60" width="900" height="300" rx="150" fill="none" stroke="url(#tp-rim1)" strokeWidth="10" filter="url(#tp-glow)" opacity=".8" />
        <rect x="880" y="-60" width="900" height="300" rx="150" fill="none" stroke="url(#tp-rim1)" strokeWidth="1.6" />
      </g>
      <g>
        <rect x="560" y="150" width="760" height="300" rx="150" fill="url(#tp-slab)" />
        <rect x="560" y="150" width="760" height="300" rx="150" fill="none" stroke="url(#tp-rim0)" strokeWidth="10" filter="url(#tp-glow)" opacity=".8" />
        <rect x="560" y="150" width="760" height="300" rx="150" fill="none" stroke="url(#tp-rim0)" strokeWidth="1.6" />
      </g>
      <g>
        <rect x="1060" y="200" width="760" height="300" rx="150" fill="url(#tp-slab)" />
        <rect x="1060" y="200" width="760" height="300" rx="150" fill="none" stroke="url(#tp-rim1)" strokeWidth="10" filter="url(#tp-glow)" opacity=".8" />
        <rect x="1060" y="200" width="760" height="300" rx="150" fill="none" stroke="url(#tp-rim1)" strokeWidth="1.6" />
      </g>
      <g>
        <rect x="760" y="340" width="700" height="320" rx="160" fill="url(#tp-slab)" />
        <rect x="760" y="340" width="700" height="320" rx="160" fill="none" stroke="url(#tp-rim0)" strokeWidth="10" filter="url(#tp-glow)" opacity=".8" />
        <rect x="760" y="340" width="700" height="320" rx="160" fill="none" stroke="url(#tp-rim0)" strokeWidth="1.6" />
      </g>
      </svg>
      <span className="tp-sheen" />
      <span className="tp-grain" />
    </div>
  );
}

export type PortalAccount = { firstName: string; store: string; town: string; tier: string; terms: string; preview?: boolean };

export function Portal({ account, catalogue, orders, best }: { account: PortalAccount; catalogue: TradeItem[]; orders: TradeOrder[]; best: { id: string; units: number; trend: number | null }[] }) {
  const items = useMemo(() => new Map(catalogue.map((c) => [c.id, c])), [catalogue]);
  const [basket, setBasket] = useState<Record<string, number>>({});
  const [placed, setPlaced] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [pending, start] = useTransition();

  const set = (id: string, n: number) => setBasket((b) => { const x = { ...b }; if (n <= 0) delete x[id]; else x[id] = n; return x; });
  const add = (id: string, n = 1) => { if (items.get(id)?.stock === "Out of stock") return; setBasket((b) => ({ ...b, [id]: (b[id] ?? 0) + n })); };
  const reorder = (o: TradeOrder) => o.lines.forEach((l) => add(l.id, l.cases));

  const lines = Object.entries(basket).map(([id, cases]) => ({ t: items.get(id)!, cases })).filter((l) => l.t);
  const totals = basketTotals(lines.map((l) => ({ item: l.t, cases: l.cases })));

  // Lines this store has bought before, newest first.
  const yours = useMemo(() => {
    const m = new Map<string, { last: string; pairs: number }>();
    for (const o of orders) {
      if (o.status === "cancelled") continue;
      for (const l of o.lines) {
        const cur = m.get(l.id);
        m.set(l.id, { last: cur?.last && cur.last > o.date ? cur.last : o.date, pairs: (cur?.pairs ?? 0) + l.cases * tradeRules.caseSize });
      }
    }
    return [...m.entries()].filter(([id]) => items.has(id)).sort((a, b) => b[1].last.localeCompare(a[1].last));
  }, [orders, items]);
  const sale = catalogue.filter((c) => c.sale);
  const season = orders.filter((o) => o.status !== "cancelled").reduce((n, o) => n + o.lines.reduce((m, l) => m + l.cases * tradeRules.caseSize, 0), 0);
  const open = orders.filter((o) => !["delivered", "cancelled"].includes(o.status)).length;

  const place = () => {
    setError("");
    start(async () => {
      const r = await placeTradeOrder(lines.map((l) => ({ id: l.t.id, cases: l.cases })));
      if (r.ok) { setPlaced(r.message); setBasket({}); } else setError(r.message);
    });
  };

  return (
    <div className="tp">
      <header className="tp-top">
        <Link href="/" className="tp-logo" aria-label="Jod-Z home"><Logo /></Link>
        <span className="tp-badge">Trade portal</span>
        <nav className="tp-nav" aria-label="Portal">
          <a href="#orders">Orders</a>
          {yours.length > 0 && <a href="#products">Your products</a>}
          <a href="#range">The range</a>
          {sale.length > 0 && <a href="#sale">On sale</a>}
        </nav>
        <div className="tp-me">
          <span className="tp-avatar" aria-hidden="true">{account.firstName[0]}</span>
          <span className="tp-me-name">{account.store}</span>
          <form action={signOutAction}><input type="hidden" name="back" value="/retailers" /><button type="submit" className="tp-icon" aria-label="Sign out"><SignOut size={18} /></button></form>
        </div>
      </header>

      <div className="tp-grid">
        <main className="tp-main">
          {account.preview && <p className="tp-demo" role="status">Admin preview of {account.store}. Ordering is disabled.</p>}
          <section className="tp-banner" aria-label="Welcome">
            <BannerArt />
            <div className="tp-banner-copy">
              <p className="tp-kicker">{account.store}{account.town ? `, ${account.town}` : ""}</p>
              <h1 className="serif">Welcome back, <em>{account.firstName}.</em></h1>
              <p className="tp-banner-sub">Your {account.tier.toLowerCase()} account. {account.terms} terms, dispatched by DPD once confirmed.</p>
            </div>
            <dl className="tp-stats">
              <div><dt>Pairs ordered</dt><dd>{season}</dd></div>
              <div><dt>Open orders</dt><dd>{open}</dd></div>
              <div><dt>Trade price</dt><dd>{eur(catalogue[0]?.trade ?? 0)}</dd></div>
            </dl>
          </section>

          <section className="tp-sec" id="orders" aria-labelledby="orders-t">
            <div className="tp-sec-head"><h2 id="orders-t" className="serif">Your orders</h2></div>
            {orders.length ? (
              <ul className="tp-orders">
                {orders.map((o) => {
                  const cases = o.lines.reduce((n, l) => n + l.cases, 0);
                  return (
                    <li key={o.id} className="tp-order">
                      <div className="tp-order-main">
                        <span className={`tp-status s-${STATUS[o.status].replace(" ", "-").toLowerCase()}`}>{STATUS[o.status]}</span>
                        <p className="tp-order-ref">{o.ref}</p>
                        <p className="tp-muted">{day(o.date)}. {cases} cases, {cases * tradeRules.caseSize} pairs</p>
                      </div>
                      <div className="tp-order-thumbs">
                        {o.lines.map((l) => items.get(l.id) && <Thumb key={l.id} t={items.get(l.id)!} size="sm" />)}
                      </div>
                      <p className="tp-order-val">{eur(o.total)}</p>
                      <button type="button" className="tp-btn-ghost" onClick={() => reorder(o)}><ArrowsClockwise size={15} /> Reorder</button>
                    </li>
                  );
                })}
              </ul>
            ) : <p className="tp-muted">No orders yet. Add cases from the range below to place your first one.</p>}
          </section>

          {yours.length > 0 && (
            <section className="tp-sec" id="products" aria-labelledby="prod-t">
              <div className="tp-sec-head"><h2 id="prod-t" className="serif">Your products</h2><p className="tp-muted">Lines you have stocked, with pairs ordered.</p></div>
              <div className="tp-rows">
                {yours.map(([id, y]) => {
                  const t = items.get(id)!;
                  return (
                    <div key={id} className="tp-row">
                      <Thumb t={t} />
                      <div className="tp-row-info">
                        <p className="tp-name">{t.name}</p>
                        <p className="tp-muted">{t.colourName}. Last ordered {day(y.last)}</p>
                      </div>
                      <div className="tp-row-meta"><span className="tp-big">{y.pairs}</span><span className="tp-muted">pairs</span></div>
                      <span className={`tp-stock ${t.stock === "Low stock" ? "low" : t.stock === "Out of stock" ? "pre" : ""}`}>{t.stock}</span>
                      <div className="tp-row-buy">
                        <span className="tp-price">{eur(casePrice(t))}<small> / case of {tradeRules.caseSize}</small></span>
                        <Stepper value={basket[id] ?? 0} onChange={(n) => set(id, n)} label={`${t.name} ${t.colourName}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          <section className="tp-sec" id="range" aria-labelledby="best-t">
            <div className="tp-sec-head"><h2 id="best-t" className="serif">The range</h2><p className="tp-muted">Bestsellers first: pairs sold across every channel in the last 90 days.</p></div>
            <div className="tp-cards">
              {[...best.map((b) => b.id), ...catalogue.map((c) => c.id).filter((id) => !best.some((b) => b.id === id))].map((id, k) => {
                const t = items.get(id);
                if (!t) return null;
                const b = best.find((x) => x.id === id);
                return (
                  <article key={id} className="tp-card">
                    <div className="tp-card-img">
                      <Thumb t={t} size="lg" />
                      {b && <span className="tp-rank">{k + 1}</span>}
                    </div>
                    <div className="tp-card-body">
                      <p className="tp-name">{t.colourName}</p>
                      <p className="tp-muted">{t.name}. RRP {eur(t.rrp)}</p>
                      <div className="tp-card-stats">
                        <span>{b ? `${b.units} pairs, 90 days` : t.stock}</span>
                        {b?.trend != null && <span className={b.trend >= 0 ? "up" : "down"}>{b.trend >= 0 ? <TrendUp size={13} /> : <TrendDown size={13} />} {Math.abs(Math.round(b.trend * 100))}%</span>}
                      </div>
                      <button type="button" className="tp-add" onClick={() => add(t.id)} disabled={t.stock === "Out of stock"}>
                        <Plus size={14} /> {t.stock === "Out of stock" ? "Out of stock" : `Add case, ${eur(casePrice(t))}`}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          {sale.length > 0 && (
            <section className="tp-sec" id="sale" aria-labelledby="sale-t">
              <div className="tp-sec-head"><h2 id="sale-t" className="serif">On sale</h2><p className="tp-muted">End-of-season trade prices while stock lasts.</p></div>
              <div className="tp-sale">
                {sale.map((t) => {
                  const off = Math.round((1 - t.sale! / t.trade) * 100);
                  return (
                    <article key={t.id} className="tp-sale-card">
                      <Thumb t={t} />
                      <div>
                        <span className="tp-off"><Tag size={12} /> {off}% off trade</span>
                        <p className="tp-name">{t.colourName}</p>
                        <p className="tp-muted">{t.name}</p>
                        <p className="tp-price"><s>{eur(t.trade)}</s> {eur(t.sale!)}<small> / pair</small></p>
                      </div>
                      <button type="button" className="tp-add" onClick={() => add(t.id)}><Plus size={14} /> Add case</button>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </main>

        <aside className="tp-basket" aria-label="Basket">
          <div className="tp-basket-inner">
            <div className="tp-basket-head">
              <h2 className="serif"><ShoppingBag size={20} /> Basket</h2>
              <span className="tp-muted">{totals.units} pairs</span>
            </div>

            {placed ? (
              <div className="tp-placed" role="status">
                <CheckCircle size={40} weight="light" />
                <p className="serif">Order placed.</p>
                <p className="tp-muted">{placed} Confirmation is on its way by email.</p>
                <button type="button" className="tp-btn-ghost" onClick={() => setPlaced(null)}>Start a new order</button>
              </div>
            ) : lines.length === 0 ? (
              <div className="tp-empty">
                <p className="serif">Nothing in your basket.</p>
                <p className="tp-muted">Reorder a previous order or add cases from the range.</p>
              </div>
            ) : (
              <>
                <div className="tp-freight">
                  <p>{totals.toFree > 0 ? <>Add <strong>{eur(totals.toFree)}</strong> for free freight</> : <><Truck size={15} /> Free freight unlocked</>}</p>
                  <div className="tp-meter"><span style={{ width: `${Math.min(100, (totals.sub / tradeRules.freeFreightOver) * 100)}%` }} /></div>
                </div>
                <ul className="tp-lines">
                  {lines.map(({ t, cases }) => (
                    <li key={t.id}>
                      <Thumb t={t} size="sm" />
                      <div className="tp-line-info">
                        <p className="tp-name">{t.colourName}</p>
                        <p className="tp-muted">{t.name}{t.sale ? ", sale" : ""}</p>
                        <Stepper value={cases} onChange={(n) => set(t.id, n)} label={`${t.name} ${t.colourName}`} />
                      </div>
                      <span className="tp-line-val">{eur(casePrice(t) * cases)}</span>
                    </li>
                  ))}
                </ul>
                <dl className="tp-sum">
                  <div><dt>Subtotal, ex VAT</dt><dd>{eur(totals.sub)}</dd></div>
                  <div><dt>Freight</dt><dd>{totals.freight ? eur(totals.freight) : "Free"}</dd></div>
                  <div><dt>VAT {Math.round(tradeRules.vat * 100)}%</dt><dd>{eur(totals.vat)}</dd></div>
                  <div className="tp-total"><dt>Total</dt><dd>{eur(totals.total)}</dd></div>
                </dl>
                <p className="tp-margin">Retail value {eur(lines.reduce((n, l) => n + l.t.rrp * l.cases * tradeRules.caseSize, 0))}. Your margin <strong>{eur(totals.margin)}</strong></p>
                {error && <p className="tp-muted" role="alert" style={{ color: "var(--danger)" }}>{error}</p>}
                <button type="button" className="tp-place" onClick={place} disabled={pending || account.preview}>
                  {pending ? "Placing order" : `Place order, ${account.terms}`} <ArrowRight size={16} />
                </button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
