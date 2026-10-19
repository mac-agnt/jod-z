import { desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { getRange } from "@/lib/metrics/range";
import { ambassadorSales } from "@/lib/metrics";
import { dateLong, fmt } from "@/lib/format";
import { decideAmbassador } from "@/lib/admin/actions";
import { ChartCard } from "@/components/admin/charts";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Ambassadors" };

export default async function Ambassadors({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin"], "/admin/ambassadors");
  const r = getRange((await searchParams).range);
  const [all, sales] = await Promise.all([db().select().from(schema.ambassadors).orderBy(desc(schema.ambassadors.createdAt)), ambassadorSales(r.start, r.end)]);
  const byCode = new Map(sales.map((s) => [s.code, s]));
  const pending = all.filter((a) => a.status === "applied");
  const guardian = all.filter((a) => a.status === "awaiting_guardian");
  const active = all.filter((a) => a.status === "approved" || a.status === "paused").map((a) => ({ a, s: a.code ? byCode.get(a.code) : undefined })).sort((x, y) => (y.s?.revenue ?? 0) - (x.s?.revenue ?? 0));
  const revenue = active.reduce((n, x) => n + (x.s?.revenue ?? 0), 0);
  const commission = active.reduce((n, x) => n + (x.s?.revenue ?? 0) * (x.a.commissionPct / 100), 0);
  const orders = active.reduce((n, x) => n + (x.s?.orders ?? 0), 0);

  return (
    <>
      <PageHead title="Ambassadors" sub={`Riders sharing a code, ${r.label.toLowerCase()}.`} range={r.key} path="/admin/ambassadors" />
      <div className="ad-stats">
        <StatTile label="Active ambassadors" value={active.filter((x) => x.a.status === "approved").length} />
        <StatTile label="Orders with a code" value={orders} />
        <StatTile label="Revenue from codes" value={revenue} format="eur" />
        <StatTile label="Commission due" value={commission} format="eur2" note="items after discounts and refunds" />
        <StatTile label="Waiting for review" value={pending.length} />
      </div>

      <ChartCard title="Applications" sub="Approving creates their code (in Shopify when connected) and emails it to them." wide>
        {pending.length ? (
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Name</th><th>Social</th><th>Applied</th><th>Age</th><th></th></tr></thead>
            <tbody>{pending.map((a) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong><span className="ad-sub">{a.email}</span></td>
                <td>{a.handle ? <a href={`https://instagram.com/${a.handle.replace("@", "")}`} target="_blank" rel="noopener" className="link-u">{a.handle}</a> : "None given"}</td>
                <td>{dateLong(a.createdAt)}<span className="ad-sub">via {a.source === "popup" ? "pop-up" : "partner page"}</span></td>
                <td>{a.under16 ? <Badge tone="info">Under 16, guardian agreed</Badge> : "16 or over"}</td>
                <td><span className="ad-actions">
                  <ActionButton tone="primary" action={decideAmbassador.bind(null, a.id, "approve")}>Approve</ActionButton>
                  <ActionButton action={decideAmbassador.bind(null, a.id, "reject")} confirm={`Reject ${a.name}?`}>Reject</ActionButton>
                </span></td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="ad-empty">No applications waiting.</p>}
        {guardian.length > 0 && <p className="ad-note">{guardian.length} under-16 application{guardian.length > 1 ? "s are" : " is"} waiting for a parent or guardian to agree: {guardian.map((g) => g.name).join(", ")}. They are deleted after 30 days without consent.</p>}
      </ChartCard>

      <ChartCard title="Ambassadors" sub="Ranked by revenue in this period." wide>
        {active.length ? (
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Ambassador</th><th>Code</th><th className="num">Orders</th><th className="num">Revenue</th><th className="num">Commission</th><th>Since</th><th></th></tr></thead>
            <tbody>{active.map(({ a, s }) => (
              <tr key={a.id}>
                <td><strong>{a.name}</strong><span className="ad-sub">{a.handle ?? a.email}</span></td>
                <td><strong>{a.code}</strong><span className="ad-sub">{a.discountPct}% off, {a.commissionPct}% commission</span></td>
                <td className="num">{fmt(s?.orders ?? 0)}</td>
                <td className="num">{fmt(s?.revenue ?? 0, "eur")}</td>
                <td className="num"><strong>{fmt((s?.revenue ?? 0) * (a.commissionPct / 100), "eur2")}</strong></td>
                <td>{a.decidedAt ? dateLong(a.decidedAt) : ""}{a.status === "paused" && <Badge tone="warn">Paused</Badge>}</td>
                <td>{a.status === "paused"
                  ? <ActionButton action={decideAmbassador.bind(null, a.id, "resume")}>Resume</ActionButton>
                  : <ActionButton action={decideAmbassador.bind(null, a.id, "pause")} confirm={`Pause ${a.name}? Also disable ${a.code} in Shopify if you want the code to stop working.`}>Pause</ActionButton>}</td>
              </tr>
            ))}</tbody>
          </table></div>
        ) : <p className="ad-empty">No ambassadors yet.</p>}
      </ChartCard>
    </>
  );
}
