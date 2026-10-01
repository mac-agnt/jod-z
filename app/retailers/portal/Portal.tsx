"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight, ArrowsClockwise, CheckCircle, Minus, Plus, ShoppingBag, SignOut, Tag, TrendDown, TrendUp, Truck } from "@phosphor-icons/react/dist/ssr";
import { Logo } from "@/components/Logo";
import { ProductRender } from "@/components/Render";
import { getProduct } from "@/lib/products";
import { account, catalogue, item, orders, tradeRules, yourProducts, type TradeItem } from "@/lib/trade";

const eur = (n: number) => new Intl.NumberFormat("en-IE", { style: "currency", currency: "EUR", minimumFractionDigits: n % 1 ? 2 : 0 }).format(n);
const unit = (t: TradeItem) => t.sale ?? t.trade;
const casePrice = (t: TradeItem) => unit(t) * tradeRules.caseSize;

function info(t: TradeItem) {
  const p = getProduct(t.product);
  const c = p?.colourways.find((x) => x.slug === t.colour);
  return { p, c, name: p?.short === "Leggings" ? "Jod-Z Legging" : p?.name ?? "", colour: c?.name ?? "" };
}

function Thumb({ t, size = "md" }: { t: TradeItem; size?: "sm" | "md" | "lg" }) {
  const { p, c } = info(t);
  if (!p || !c) return null;
  return (
    <div className={`tp-thumb tp-thumb-${size}`}>
      {c.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={c.image} alt={`${p.name} in ${c.name}`} loading="lazy" />
      ) : (
        <ProductRender kind={p.kind} hex={c.hex} title={`${p.name} in ${c.name}`} />
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

export function Portal() {
  const [basket, setBasket] = useState<Record<string, number>>({ "leg-buttermilk": 2, "leg-navy": 1 });
  const [placed, setPlaced] = useState<string | null>(null);

  const set = (id: string, n: number) => setBasket((b) => { const x = { ...b }; if (n <= 0) delete x[id]; else x[id] = n; return x; });
  const add = (id: string, n = 1) => setBasket((b) => ({ ...b, [id]: (b[id] ?? 0) + n }));
  const reorder = (ref: string) => orders.find((o) => o.ref === ref)?.lines.forEach((l) => add(l.id, l.cases));

  const lines = Object.entries(basket).map(([id, cases]) => ({ t: item(id)!, cases })).filter((l) => l.t);
  const sub = lines.reduce((n, l) => n + casePrice(l.t) * l.cases, 0);
  const units = lines.reduce((n, l) => n + l.cases * tradeRules.caseSize, 0);
  const freight = sub === 0 || sub >= tradeRules.freeFreightOver ? 0 : tradeRules.freight;
  const vat = (sub + freight) * tradeRules.vat;
  const total = sub + freight + vat;
  const toFree = Math.max(0, tradeRules.freeFreightOver - sub);
  const margin = lines.reduce((n, l) => n + (l.t.rrp - unit(l.t)) * l.cases * tradeRules.caseSize, 0);

  const best = useMemo(() => catalogue.filter((c) => c.sellThrough).sort((a, b) => b.sellThrough! - a.sellThrough!).slice(0, 6), []);
  const sale = useMemo(() => catalogue.filter((c) => c.sale), []);
  const season = orders.reduce((n, o) => n + o.lines.reduce((m, l) => m + l.cases * tradeRules.caseSize, 0), 0);

  const place = () => {
    setPlaced(`JZ-T-${10483 + Math.floor(Math.random() * 90)}`);
    setBasket({});
  };

  return (
    <div className="tp">
      <header className="tp-top">
        <Link href="/" className="tp-logo" aria-label="Jod-Z home"><Logo /></Link>
        <span className="tp-badge">Trade portal</span>
        <nav className="tp-nav" aria-label="Portal">
          <a href="#orders">Orders</a>
          <a href="#products">Your products</a>
          <a href="#bestsellers">Bestsellers</a>
          <a href="#sale">On sale</a>
        </nav>
        <div className="tp-me">
          <span className="tp-avatar" aria-hidden="true">{account.firstName[0]}</span>
          <span className="tp-me-name">{account.store}</span>
          <Link href="/retailers" className="tp-icon" aria-label="Sign out"><SignOut size={18} /></Link>
        </div>
      </header>

      <div className="tp-grid">
        <main className="tp-main">
          <section className="tp-banner" aria-label="Welcome">
            <BannerArt />
            <div className="tp-banner-copy">
              <p className="tp-kicker">{account.store}, {account.town}</p>
              <h1 className="serif">Welcome back, <em>{account.firstName}.</em></h1>
              <p className="tp-banner-sub">Your {account.tier.toLowerCase()} account. {account.terms} terms, dispatched by DPD in 1 to 3 working days.</p>
            </div>
            <dl className="tp-stats">
              <div><dt>Units this season</dt><dd>{season}</dd></div>
              <div><dt>Open orders</dt><dd>{orders.filter((o) => o.status !== "Delivered").length}</dd></div>
              <div><dt>Your rep</dt><dd>{account.rep}</dd></div>
            </dl>
          </section>

          <section className="tp-sec" id="orders" aria-labelledby="orders-t">
            <div className="tp-sec-head"><h2 id="orders-t" className="serif">Previous orders</h2></div>
            <ul className="tp-orders">
              {orders.map((o) => {
                const val = o.lines.reduce((n, l) => n + casePrice(item(l.id)!) * l.cases, 0);
                const cases = o.lines.reduce((n, l) => n + l.cases, 0);
                return (
                  <li key={o.ref} className="tp-order">
                    <div className="tp-order-main">
                      <span className={`tp-status s-${o.status.replace(" ", "-").toLowerCase()}`}>{o.status}</span>
                      <p className="tp-order-ref">{o.ref}</p>
                      <p className="tp-muted">{o.date}. {cases} cases, {cases * tradeRules.caseSize} units</p>
                    </div>
                    <div className="tp-order-thumbs">
                      {o.lines.map((l) => <Thumb key={l.id} t={item(l.id)!} size="sm" />)}
                    </div>
                    <p className="tp-order-val">{eur(val)}</p>
                    <button type="button" className="tp-btn-ghost" onClick={() => reorder(o.ref)}><ArrowsClockwise size={15} /> Reorder</button>
                  </li>
                );
              })}
            </ul>
          </section>

          <section className="tp-sec" id="products" aria-labelledby="prod-t">
            <div className="tp-sec-head"><h2 id="prod-t" className="serif">Your products</h2><p className="tp-muted">Lines you have stocked, with units sold through your till.</p></div>
            <div className="tp-rows">
              {yourProducts.map((y) => {
                const t = item(y.id)!;
                const { name, colour } = info(t);
                return (
                  <div key={y.id} className="tp-row">
                    <Thumb t={t} />
                    <div className="tp-row-info">
                      <p className="tp-name">{name}</p>
                      <p className="tp-muted">{colour}. Last ordered {y.last}</p>
                    </div>
                    <div className="tp-row-meta"><span className="tp-big">{y.soldAtYou}</span><span className="tp-muted">sold</span></div>
                    <span className={`tp-stock ${t.stock === "Low stock" ? "low" : t.stock === "Pre-order" ? "pre" : ""}`}>{t.stock}</span>
                    <div className="tp-row-buy">
                      <span className="tp-price">{eur(casePrice(t))}<small> / case of {tradeRules.caseSize}</small></span>
                      <Stepper value={basket[y.id] ?? 0} onChange={(n) => set(y.id, n)} label={`${name} ${colour}`} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          <section className="tp-sec" id="bestsellers" aria-labelledby="best-t">
            <div className="tp-sec-head"><h2 id="best-t" className="serif">Bestsellers</h2><p className="tp-muted">Ranked by 30-day sell-through across every Jod-Z stockist.</p></div>
            <div className="tp-cards">
              {best.map((t, k) => {
                const { name, colour } = info(t);
                return (
                  <article key={t.id} className="tp-card">
                    <div className="tp-card-img">
                      <Thumb t={t} size="lg" />
                      <span className="tp-rank">{k + 1}</span>
                    </div>
                    <div className="tp-card-body">
                      <p className="tp-name">{colour}</p>
                      <p className="tp-muted">{name}</p>
                      <div className="tp-meter" aria-label={`${t.sellThrough}% sell-through`}>
                        <span style={{ width: `${t.sellThrough}%` }} />
                      </div>
                      <div className="tp-card-stats">
                        <span>{t.sellThrough}% sell-through</span>
                        <span className={t.trend! >= 0 ? "up" : "down"}>{t.trend! >= 0 ? <TrendUp size={13} /> : <TrendDown size={13} />} {Math.abs(t.trend!)}%</span>
                      </div>
                      <button type="button" className="tp-add" onClick={() => add(t.id)}><Plus size={14} /> Add case, {eur(casePrice(t))}</button>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <section className="tp-sec" id="sale" aria-labelledby="sale-t">
            <div className="tp-sec-head"><h2 id="sale-t" className="serif">On sale</h2><p className="tp-muted">End-of-season trade prices while stock lasts.</p></div>
            <div className="tp-sale">
              {sale.map((t) => {
                const { name, colour } = info(t);
                const off = Math.round((1 - t.sale! / t.trade) * 100);
                return (
                  <article key={t.id} className="tp-sale-card">
                    <Thumb t={t} />
                    <div>
                      <span className="tp-off"><Tag size={12} /> {off}% off trade</span>
                      <p className="tp-name">{colour}</p>
                      <p className="tp-muted">{name}</p>
                      <p className="tp-price"><s>{eur(t.trade)}</s> {eur(t.sale!)}<small> / unit</small></p>
                    </div>
                    <button type="button" className="tp-add" onClick={() => add(t.id)}><Plus size={14} /> Add case</button>
                  </article>
                );
              })}
            </div>
          </section>
          <p className="tp-demo">Demo data. Connects to the Jod-Z wholesale system at launch.</p>
        </main>

        <aside className="tp-basket" aria-label="Basket">
          <div className="tp-basket-inner">
            <div className="tp-basket-head">
              <h2 className="serif"><ShoppingBag size={20} /> Basket</h2>
              <span className="tp-muted">{units} units</span>
            </div>

            {placed ? (
              <div className="tp-placed">
                <CheckCircle size={40} weight="light" />
                <p className="serif">Order placed.</p>
                <p className="tp-muted">{placed} is with our warehouse. Tracking follows by email.</p>
                <button type="button" className="tp-btn-ghost" onClick={() => setPlaced(null)}>Start a new order</button>
              </div>
            ) : lines.length === 0 ? (
              <div className="tp-empty">
                <p className="serif">Nothing in your basket.</p>
                <p className="tp-muted">Reorder a previous order or add cases from bestsellers.</p>
              </div>
            ) : (
              <>
                <div className="tp-freight">
                  <p>{toFree > 0 ? <>Add <strong>{eur(toFree)}</strong> for free freight</> : <><Truck size={15} /> Free freight unlocked</>}</p>
                  <div className="tp-meter"><span style={{ width: `${Math.min(100, (sub / tradeRules.freeFreightOver) * 100)}%` }} /></div>
                </div>
                <ul className="tp-lines">
                  {lines.map(({ t, cases }) => {
                    const { name, colour } = info(t);
                    return (
                      <li key={t.id}>
                        <Thumb t={t} size="sm" />
                        <div className="tp-line-info">
                          <p className="tp-name">{colour}</p>
                          <p className="tp-muted">{name}{t.sale ? ", sale" : ""}</p>
                          <Stepper value={cases} onChange={(n) => set(t.id, n)} label={`${name} ${colour}`} />
                        </div>
                        <span className="tp-line-val">{eur(casePrice(t) * cases)}</span>
                      </li>
                    );
                  })}
                </ul>
                <dl className="tp-sum">
                  <div><dt>Subtotal, ex VAT</dt><dd>{eur(sub)}</dd></div>
                  <div><dt>Freight</dt><dd>{freight ? eur(freight) : "Free"}</dd></div>
                  <div><dt>VAT 23%</dt><dd>{eur(vat)}</dd></div>
                  <div className="tp-total"><dt>Total</dt><dd>{eur(total)}</dd></div>
                </dl>
                <p className="tp-margin">Retail value {eur(units * 59)}. Your margin <strong>{eur(margin)}</strong></p>
                <button type="button" className="tp-place" onClick={place}>Place order, {account.terms} <ArrowRight size={16} /></button>
              </>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
