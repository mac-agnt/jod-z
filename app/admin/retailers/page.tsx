import { desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { recentOrders, wholesaleTotals } from "@/lib/metrics";
import { dateLong, fmt } from "@/lib/format";
import { decideRetailer, setWholesaleStatus, updateRetailerTerms } from "@/lib/admin/actions";
import type { WholesaleStatus } from "@/lib/db/schema";
import { ChartCard } from "@/components/admin/charts";
import { ActionButton, ActionForm } from "@/components/admin/ActionButton";
import { Badge, PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Stockists" };

const next: Record<WholesaleStatus, WholesaleStatus | null> = { submitted: "confirmed", confirmed: "shipped", shipped: "delivered", delivered: null, cancelled: null };
const tone = { submitted: "warn", confirmed: "info", shipped: "info", delivered: "good", cancelled: "bad" } as const;

export default async function Retailers() {
  await requireRole(["admin"], "/admin/retailers");
  const [all, totals, orders] = await Promise.all([db().select().from(schema.retailers).orderBy(desc(schema.retailers.createdAt)), wholesaleTotals(), recentOrders(40, "wholesale")]);
  const t = new Map(totals.map((x) => [x.retailerId, x]));
  const pending = all.filter((r) => r.status === "applied");
  const active = all.filter((r) => r.status === "approved" || r.status === "paused");
  const open = orders.filter((o) => o.wholesaleStatus && !["delivered", "cancelled"].includes(o.wholesaleStatus));

  return (
    <>
      <PageHead title="Stockists" sub="Trade accounts and wholesale orders from the retailer portal." />
      <div className="ad-stats">
        <StatTile label="Active stockists" value={active.filter((r) => r.status === "approved").length} />
        <StatTile label="Open trade orders" value={open.length} />
        <StatTile label="Wholesale, all time" value={totals.reduce((n, x) => n + x.value, 0)} format="eur" note="ex VAT" />
        <StatTile label="Pairs wholesaled" value={totals.reduce((n, x) => n + x.units, 0)} />
      </div>

      <ChartCard title="Applications" sub="Approving lets them sign in to the trade portal with their email." wide>
        {pending.length ? (
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Store</th><th>Contact</th><th>Location</th><th>Details</th><th></th></tr></thead>
            <tbody>{pending.map((r) => (
              <tr key={r.id}>
                <td><strong>{r.storeName}</strong><span className="ad-sub">{r.storeType}</span></td>
                <td>{r.contactName}<span className="ad-sub">{r.email}{r.phone ? `, ${r.phone}` : ""}</span></td>
                <td>{r.town}<span className="ad-sub">{r.country}</span></td>
                <td>{r.website && <span className="ad-sub">{r.website}</span>}{r.vatNumber && <span className="ad-sub">VAT {r.vatNumber}</span>}{r.message && <span className="ad-sub">&ldquo;{r.message}&rdquo;</span>}<span className="ad-sub">Applied {dateLong(r.createdAt)}</span></td>
                <td><span className="ad-actions">
                  <ActionButton tone="primary" action={decideRetailer.bind(null, r.id, "approve")}>Approve</ActionButton>
                  <ActionButton action={decideRetailer.bind(null, r.id, "reject")} confirm={`Reject ${r.storeName}?`}>Reject</ActionButton>
                </span></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="ad-empty">No applications waiting.</p>}
      </ChartCard>

      <section id="orders" style={{ display: "contents" }}>
        <ChartCard title="Trade orders" sub="Move each order on as it progresses. The stockist sees the same status in their portal." wide>
          {orders.length ? (
            <div className="ad-table-wrap"><table className="ad-table">
              <thead><tr><th>Order</th><th>Stockist</th><th>Lines</th><th className="num">Total inc. VAT</th><th>Status</th><th></th></tr></thead>
              <tbody>{orders.map((o) => {
                const s = (o.wholesaleStatus ?? "submitted") as WholesaleStatus;
                const n = next[s];
                return (
                  <tr key={o.id}>
                    <td><strong>{o.number}</strong><span className="ad-sub">{dateLong(o.placedAt)}</span></td>
                    <td>{o.store ?? "Unknown"}</td>
                    <td><span className="ad-sub" style={{ marginTop: 0 }}>{o.items}</span></td>
                    <td className="num"><strong>{fmt(o.total, "eur2")}</strong></td>
                    <td><Badge tone={tone[s]}>{s}</Badge></td>
                    <td><span className="ad-actions">
                      {n && <ActionButton tone={s === "submitted" ? "primary" : undefined} action={setWholesaleStatus.bind(null, o.id, n)}>Mark {n}</ActionButton>}
                      {s === "submitted" && <ActionButton tone="danger" action={setWholesaleStatus.bind(null, o.id, "cancelled")} confirm={`Cancel ${o.number}?`}>Cancel</ActionButton>}
                    </span></td>
                  </tr>
                );
              })}</tbody>
            </table></div>
          ) : <p className="ad-empty">No trade orders yet.</p>}
        </ChartCard>
      </section>

      <ChartCard title="Stockists" wide>
        {active.length ? (
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Store</th><th className="num">Orders</th><th className="num">Pairs</th><th className="num">Value ex VAT</th><th>Last order</th><th>Terms</th><th></th></tr></thead>
            <tbody>{active.map((r) => {
              const x = t.get(r.id);
              return (
                <tr key={r.id}>
                  <td><strong>{r.storeName}</strong><span className="ad-sub">{r.contactName}, {r.town}</span>{r.status === "paused" && <Badge tone="warn">Paused</Badge>}</td>
                  <td className="num">{fmt(x?.orders ?? 0)}</td>
                  <td className="num">{fmt(x?.units ?? 0)}</td>
                  <td className="num">{fmt(x?.value ?? 0, "eur")}</td>
                  <td>{x?.last ? dateLong(x.last) : "None yet"}</td>
                  <td>
                    <ActionForm action={updateRetailerTerms.bind(null, r.id)} submit="Save">
                      <input className="ad-input" style={{ width: 110 }} name="tier" defaultValue={r.tier} aria-label="Tier" />
                      <select className="ad-select" name="paymentTerms" defaultValue={r.paymentTerms} aria-label="Payment terms"><option>Prepay</option><option>Net 14</option><option>Net 30</option></select>
                      <input className="ad-input" style={{ width: 64 }} name="tradeDiscountPct" type="number" min={0} max={70} defaultValue={r.tradeDiscountPct} aria-label="Trade discount percent" />%
                    </ActionForm>
                  </td>
                  <td>{r.status === "approved"
                    ? <ActionButton action={decideRetailer.bind(null, r.id, "pause")} confirm={`Pause ${r.storeName}? They will not be able to sign in.`}>Pause</ActionButton>
                    : <ActionButton action={decideRetailer.bind(null, r.id, "approve")}>Reactivate</ActionButton>}</td>
                </tr>
              );
            })}</tbody>
          </table></div>
        ) : <p className="ad-empty">No stockists yet.</p>}
      </ChartCard>
    </>
  );
}
