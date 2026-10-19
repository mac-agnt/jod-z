import { requireRole } from "@/lib/auth";
import { integrations } from "@/lib/env";
import { inventoryGrid } from "@/lib/metrics";
import { products } from "@/lib/products";
import { dateTime, fmt } from "@/lib/format";
import { ChartCard } from "@/components/admin/charts";
import { Badge, PageHead } from "@/components/admin/ui";

export const metadata = { title: "Stock" };

const LOW = 3;

export default async function Inventory() {
  await requireRole(["admin"], "/admin/inventory");
  const rows = await inventoryGrid();
  const at = (p: string, c: string, s: string) => rows.find((r) => r.product === p && r.colour === c && r.size === s);
  const updated = rows.reduce<string | null>((m, r) => (!m || r.updatedAt > m ? r.updatedAt : m), null);
  const source = rows[0]?.provider === "shopify" ? "Shopify" : rows.length ? "demo stock" : null;
  const low = rows.filter((r) => r.available <= LOW).sort((a, b) => a.available - b.available || b.sold30 - a.sold30);

  return (
    <>
      <PageHead title="Stock" sub={source ? `From ${source}${updated ? `, updated ${dateTime(updated)}` : ""}.` : "No stock data yet."} />
      {!integrations().shopifyAdmin && <p className="ad-note">Connect the Shopify Admin API in Settings to pull live stock every day. Until then the shop reads availability straight from Shopify at checkout.</p>}

      <ChartCard title="Sold out or running low" sub={`${LOW} or fewer left, with pairs sold in the last 30 days.`} wide>
        {low.length ? (
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Item</th><th>Size</th><th className="num">In stock</th><th className="num">Sold, 30 days</th><th>Status</th></tr></thead>
            <tbody>{low.map((r) => {
              const p = products.find((x) => x.slug === r.product);
              return (
                <tr key={`${r.product}-${r.colour}-${r.size}`}>
                  <td><strong>{p?.colourways.find((c) => c.slug === r.colour)?.name ?? r.colour}</strong><span className="ad-sub">{p?.name}</span></td>
                  <td>{r.size}</td><td className="num">{r.available}</td><td className="num">{r.sold30}</td>
                  <td>{r.available === 0 ? <Badge tone="bad">Sold out</Badge> : <Badge tone="warn">Low</Badge>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <p className="ad-empty">Nothing is low. Good.</p>}
      </ChartCard>

      {products.map((p) => (
        <ChartCard key={p.slug} title={p.name} sub="Pairs in stock by colour and size. Cover is days of stock left at the last 30 days' pace." wide>
          <div className="ad-table-wrap"><table className="ad-table ad-inv">
            <thead><tr><th>Colour</th>{p.sizes.map((s) => <th key={s} className="num">{s}</th>)}<th className="num">Total</th><th className="num">Sold, 30 days</th><th className="num">Cover</th></tr></thead>
            <tbody>{p.colourways.map((c) => {
              const cells = p.sizes.map((s) => at(p.slug, c.slug, s));
              const total = cells.reduce((n, x) => n + (x?.available ?? 0), 0);
              const sold = cells.reduce((n, x) => n + (x?.sold30 ?? 0), 0);
              const cover = sold ? Math.round(total / (sold / 30)) : null;
              return (
                <tr key={c.slug}>
                  <td><span style={{ display: "inline-flex", gap: 8, alignItems: "center" }}><span className="ad-swatch" style={{ background: c.hex }} aria-hidden="true" /><strong>{c.name}</strong></span></td>
                  {cells.map((x, i) => <td key={p.sizes[i]} className={`num ${x ? (x.available === 0 ? "zero" : x.available <= LOW ? "low" : "") : ""}`}>{x ? x.available : "n/a"}</td>)}
                  <td className="num"><strong>{fmt(total)}</strong></td><td className="num">{fmt(sold)}</td>
                  <td className="num">{cover == null ? "n/a" : cover > 365 ? "365+ days" : `${cover} days`}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        </ChartCard>
      ))}
    </>
  );
}
