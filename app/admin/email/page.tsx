import Link from "next/link";
import { desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { integrations } from "@/lib/env";
import { db, schema } from "@/lib/db";
import { getRange } from "@/lib/metrics/range";
import { emailKpis, emailTable, listSizeByDay, signupsBySource } from "@/lib/metrics";
import { dateLong, dateTime, fmt } from "@/lib/format";
import { Bars, ChartCard, LineChart } from "@/components/admin/charts";
import { Badge, PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Email list" };

const SOURCE: Record<string, string> = { footer: "Footer sign-up", popup: "Pop-up", restock: "Back-in-stock alert", contact: "Contact form" };

export default async function Email({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin"], "/admin/email");
  const r = getRange((await searchParams).range);
  const [k, list, sources, campaigns, flows, latest] = await Promise.all([
    emailKpis(r), listSizeByDay(r), signupsBySource(r.start, r.end), emailTable("campaign", r.start, r.end), emailTable("flow"),
    db().select().from(schema.subscribers).orderBy(desc(schema.subscribers.createdAt)).limit(15),
  ]);
  const rate = (a: number, b: number) => (b ? a / b : null);
  const klaviyo = integrations().klaviyo;

  return (
    <>
      <PageHead title="Email list" sub={`${klaviyo ? "Klaviyo list" : "Site sign-ups"}, ${r.label.toLowerCase()}.`} range={r.key} path="/admin/email" />
      {!klaviyo && <p className="ad-note">Sign-ups are stored here and confirmed by email. Connect Klaviyo in <Link href="/admin/settings" className="link-u">Settings</Link> to send campaigns and see list size, opens and email revenue.</p>}
      <div className="ad-stats">
        <StatTile label="List size" value={k.listSize} note={k.growth != null ? `${k.growth >= 0 ? "+" : ""}${fmt(k.growth)} this period` : undefined} />
        <StatTile label="Sign-ups on the site" value={k.signups} note={`${fmt(k.confirmed)} confirmed`} />
        <StatTile label="Campaigns sent" value={k.sent} />
        <StatTile label="Open rate" value={rate(k.opens, k.recipients)} format="pct" />
        <StatTile label="Click rate" value={rate(k.clicks, k.recipients)} format="pct" />
        <StatTile label="Campaign revenue" value={k.revenue} format="eur" />
      </div>

      <div className="ad-grid-2">
        <ChartCard title="List size" table={{ head: ["Date", "Subscribers"], rows: list.map((x) => [x.date, x.value]) }}>
          {list.length > 1 ? <LineChart label="Subscribers over time" series={[{ name: "Subscribers", slot: 1, points: list }]} height={220} /> : <p className="ad-empty">List size appears after the first Klaviyo sync.</p>}
        </ChartCard>
        <ChartCard title="Where sign-ups came from" table={{ head: ["Source", "Sign-ups"], rows: sources.map((s) => [SOURCE[s.key] ?? s.key, s.value]) }}>
          <Bars label="Sign-ups by source" rows={sources.map((s) => ({ key: s.key, label: SOURCE[s.key] ?? s.key, value: s.value }))} />
        </ChartCard>
      </div>

      <ChartCard title="Campaigns" sub="Sent in this period." wide>
        {campaigns.length ? (
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Campaign</th><th>Sent</th><th className="num">Recipients</th><th className="num">Opens</th><th className="num">Clicks</th><th className="num">Orders</th><th className="num">Revenue</th></tr></thead>
            <tbody>{campaigns.map((c) => (
              <tr key={c.id}><td><strong>{c.name}</strong></td><td>{c.sentAt ? dateLong(c.sentAt) : "Draft"}</td><td className="num">{fmt(c.recipients)}</td><td className="num">{fmt(rate(c.opens, c.recipients), "pct")}</td><td className="num">{fmt(rate(c.clicks, c.recipients), "pct")}</td><td className="num">{fmt(c.conversions)}</td><td className="num"><strong>{fmt(c.revenue, "eur")}</strong></td></tr>
            ))}</tbody>
          </table></div>
        ) : <p className="ad-empty">No campaigns sent in this period.</p>}
      </ChartCard>

      <div className="ad-grid-2">
        <ChartCard title="Automated flows" sub="Last 12 months.">
          {flows.length ? (
            <div className="ad-table-wrap"><table className="ad-table">
              <thead><tr><th>Flow</th><th className="num">Sent</th><th className="num">Orders</th><th className="num">Revenue</th></tr></thead>
              <tbody>{flows.map((f) => <tr key={f.id}><td><strong>{f.name}</strong></td><td className="num">{fmt(f.recipients)}</td><td className="num">{fmt(f.conversions)}</td><td className="num"><strong>{fmt(f.revenue, "eur")}</strong></td></tr>)}</tbody>
            </table></div>
          ) : <p className="ad-empty">Set up Welcome, Abandoned checkout and Back in stock flows in Klaviyo. See docs/LAUNCH.md.</p>}
        </ChartCard>
        <ChartCard title="Latest sign-ups">
          <div className="ad-table-wrap"><table className="ad-table">
            <thead><tr><th>Email</th><th>Source</th><th>Status</th></tr></thead>
            <tbody>{latest.map((s) => (
              <tr key={s.id}><td>{s.email}<span className="ad-sub">{dateTime(s.createdAt)}</span></td><td>{SOURCE[s.source] ?? s.source}</td><td><Badge tone={s.status === "subscribed" ? "good" : s.status === "pending" ? "warn" : "neutral"}>{s.status}</Badge></td></tr>
            ))}</tbody>
          </table></div>
        </ChartCard>
      </div>
    </>
  );
}
