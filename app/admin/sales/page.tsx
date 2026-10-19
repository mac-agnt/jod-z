import { requireRole } from "@/lib/auth";
import { getRange } from "@/lib/metrics/range";
import { recentOrders, revenueByDay, salesByLine, salesByOrder, salesKpis } from "@/lib/metrics";
import { getProduct, products } from "@/lib/products";
import { dateTime, fmt, sourceLabel } from "@/lib/format";
import { Bars, ChartCard, LineChart } from "@/components/admin/charts";
import { Badge, PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Sales" };

const colour = (slug: string) => products.flatMap((p) => p.colourways).find((c) => c.slug === slug);
const COUNTRIES: Record<string, string> = { IE: "Ireland", GB: "United Kingdom", DE: "Germany", FR: "France", NL: "Netherlands", ES: "Spain", BE: "Belgium", IT: "Italy" };
const statusTone = { paid: "good", pending: "warn", partially_refunded: "warn", refunded: "bad", cancelled: "bad" } as const;

export default async function Sales({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin"], "/admin/sales");
  const r = getRange((await searchParams).range);
  const [k, p, rev, colours, sizes, prods, countries, sources, recent] = await Promise.all([
    salesKpis(r.start, r.end), salesKpis(r.prevStart, r.prevEnd), revenueByDay(r),
    salesByLine("colour", r.start, r.end), salesByLine("size", r.start, r.end), salesByLine("product", r.start, r.end),
    salesByOrder("country", r.start, r.end), salesByOrder("source", r.start, r.end), recentOrders(30),
  ]);
  const legSizes = getProduct("the-jod-z")!.sizes;
  const sizeRows = [...sizes].sort((a, b) => (legSizes.indexOf(a.key) + 99) % 99 - (legSizes.indexOf(b.key) + 99) % 99);

  return (
    <>
      <PageHead title="Sales" sub={`Online orders, ${r.label.toLowerCase()}. Wholesale is under Stockists.`} range={r.key} path="/admin/sales" />
      <div className="ad-stats">
        <StatTile label="Revenue" value={k.revenue} prev={p.revenue} format="eur" spark={rev} />
        <StatTile label="Orders" value={k.orders} prev={p.orders} />
        <StatTile label="Average order" value={k.aov} prev={p.aov} format="eur2" />
        <StatTile label="Pairs sold" value={k.units} prev={p.units} note={k.orders ? `${(k.units / k.orders).toFixed(1)} per order` : undefined} />
        <StatTile label="New customers" value={k.orders ? k.newCustomers / k.orders : null} prev={p.orders ? p.newCustomers / p.orders : null} format="pct" note={`${k.newCustomers} first orders`} />
        <StatTile label="Refunds" value={k.refunds} prev={p.refunds} format="eur" upIsGood={false} />
        <StatTile label="Discounts given" value={k.discounts} prev={p.discounts} format="eur" upIsGood={false} />
      </div>

      <ChartCard title="Revenue per day" wide table={{ head: ["Date", "Revenue"], rows: rev.map((x) => [x.date, fmt(x.value, "eur")]) }}>
        <LineChart label="Revenue per day" format="eur" series={[{ name: "Revenue", slot: 1, points: rev }]} />
      </ChartCard>

      <div className="ad-grid-2">
        <ChartCard title="By colour" sub="Revenue, with pairs sold." table={{ head: ["Colour", "Pairs", "Revenue"], rows: colours.map((c) => [colour(c.key)?.name ?? c.key, c.units, fmt(c.revenue, "eur")]) }}>
          <Bars label="Revenue by colour" format="eur" rows={colours.map((c) => ({ key: c.key, label: colour(c.key)?.name ?? c.key, swatch: colour(c.key)?.hex, value: c.revenue, note: `${c.units} pairs` }))} />
        </ChartCard>
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <ChartCard title="By size" sub="Pairs sold." table={{ head: ["Size", "Pairs", "Revenue"], rows: sizeRows.map((s) => [s.key, s.units, fmt(s.revenue, "eur")]) }}>
            <Bars label="Pairs by size" rows={sizeRows.map((s) => ({ key: s.key, label: s.key, value: s.units }))} />
          </ChartCard>
          <ChartCard title="By product" table={{ head: ["Product", "Pairs", "Revenue"], rows: prods.map((x) => [getProduct(x.key)?.name ?? x.key, x.units, fmt(x.revenue, "eur")]) }}>
            <Bars label="Revenue by product" format="eur" rows={prods.map((x) => ({ key: x.key, label: getProduct(x.key)?.name ?? x.key, value: x.revenue, note: `${x.units} pairs` }))} />
          </ChartCard>
        </div>
        <ChartCard title="By country" table={{ head: ["Country", "Orders", "Revenue"], rows: countries.map((c) => [COUNTRIES[c.key] ?? c.key, c.orders ?? 0, fmt(c.revenue, "eur")]) }}>
          <Bars label="Revenue by country" format="eur" rows={countries.map((c) => ({ key: c.key, label: COUNTRIES[c.key] ?? c.key, value: c.revenue, note: `${c.orders} orders` }))} />
        </ChartCard>
        <ChartCard title="By source" sub="First-touch UTM source carried into checkout." table={{ head: ["Source", "Orders", "Revenue"], rows: sources.map((s) => [sourceLabel(s.key), s.orders ?? 0, fmt(s.revenue, "eur")]) }}>
          <Bars label="Revenue by source" format="eur" rows={sources.map((s) => ({ key: s.key, label: sourceLabel(s.key), value: s.revenue, note: `${s.orders} orders` }))} />
        </ChartCard>
      </div>

      <ChartCard title="Latest orders" sub="Newest first. Open Shopify for addresses and fulfilment." wide>
        <div className="ad-table-wrap">
          <table className="ad-table">
            <thead><tr><th>Order</th><th>Placed</th><th>Items</th><th>Source</th><th>Status</th><th className="num">Total</th></tr></thead>
            <tbody>
              {recent.map((o) => (
                <tr key={o.id}>
                  <td><strong>{o.number}</strong>{o.isDemo && <span className="ad-sub">demo</span>}</td>
                  <td>{dateTime(o.placedAt)}<span className="ad-sub">{COUNTRIES[o.country ?? ""] ?? o.country}</span></td>
                  <td>{o.items}{o.codes.length > 0 && <span className="ad-sub">Code {o.codes.join(", ")}</span>}</td>
                  <td>{sourceLabel(o.source ?? "direct")}</td>
                  <td><Badge tone={statusTone[o.status as keyof typeof statusTone] ?? "neutral"}>{o.status.replace("_", " ")}</Badge></td>
                  <td className="num"><strong>{fmt(o.total, "eur2")}</strong>{o.refunded > 0 && <span className="ad-sub">−{fmt(o.refunded, "eur2")} refunded</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {!recent.length && <p className="ad-empty">No orders yet.</p>}
        </div>
      </ChartCard>
    </>
  );
}
