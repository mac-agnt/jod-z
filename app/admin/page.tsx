import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { getRange } from "@/lib/metrics/range";
import { adsKpis, emailKpis, inboxCounts, inventoryGrid, revenueByDay, salesByLine, salesByOrder, salesKpis, trafficKpis } from "@/lib/metrics";
import { getProduct } from "@/lib/products";
import { fmt, sourceLabel } from "@/lib/format";
import { Bars, ChartCard, Funnel, LineChart } from "@/components/admin/charts";
import { PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Overview" };

const colourName = (slug: string) => getProduct("the-jod-z")?.colourways.find((c) => c.slug === slug) ?? getProduct("jockey-breech")?.colourways.find((c) => c.slug === slug);

export default async function Overview({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin"], "/admin");
  const r = getRange((await searchParams).range);
  const [sales, prev, ads, prevAds, email, traffic, prevTraffic, rev, prevRev, colours, sources, counts, stock] = await Promise.all([
    salesKpis(r.start, r.end), salesKpis(r.prevStart, r.prevEnd), adsKpis(r.start, r.end), adsKpis(r.prevStart, r.prevEnd), emailKpis(r),
    trafficKpis(r.start, r.end), trafficKpis(r.prevStart, r.prevEnd), revenueByDay(r), revenueByDay({ start: r.prevStart, end: r.prevEnd }),
    salesByLine("colour", r.start, r.end), salesByOrder("source", r.start, r.end), inboxCounts(), inventoryGrid(),
  ]);
  const cr = traffic.visitors ? sales.orders / traffic.visitors : 0;
  const prevCr = prevTraffic.visitors ? prev.orders / prevTraffic.visitors : 0;
  const mer = ads.spend ? sales.revenue / ads.spend : null;
  const prevMer = prevAds.spend ? prev.revenue / prevAds.spend : null;
  const low = stock.filter((s) => s.available <= 3);
  const out = low.filter((s) => s.available === 0).length;
  const prevAligned = rev.map((p, i) => ({ date: p.date, value: prevRev[i]?.value ?? 0 }));

  const todo = [
    counts.ambassadors && { href: "/admin/ambassadors", text: `${counts.ambassadors} ambassador application${counts.ambassadors > 1 ? "s" : ""} to review` },
    counts.retailers && { href: "/admin/retailers", text: `${counts.retailers} stockist application${counts.retailers > 1 ? "s" : ""} to review` },
    counts.wholesale && { href: "/admin/retailers#orders", text: `${counts.wholesale} trade order${counts.wholesale > 1 ? "s" : ""} to confirm` },
    counts.messages && { href: "/admin/messages", text: `${counts.messages} new message${counts.messages > 1 ? "s" : ""}` },
    low.length && { href: "/admin/inventory", text: [out && `${out} size${out > 1 ? "s" : ""} sold out`, low.length - out && `${low.length - out} running low`].filter(Boolean).join(", ") },
  ].filter(Boolean) as { href: string; text: string }[];

  return (
    <>
      <PageHead title="Overview" sub={`Online shop, ${r.label.toLowerCase()}, compared with the ${r.days} days before.`} range={r.key} path="/admin" />
      <div className="ad-stats">
        <StatTile hero label="Revenue" value={sales.revenue} prev={prev.revenue} format="eur" spark={rev} note="after refunds" />
        <StatTile label="Orders" value={sales.orders} prev={prev.orders} />
        <StatTile label="Average order" value={sales.aov} prev={prev.aov} format="eur2" />
        <StatTile label="Conversion rate" value={cr} prev={prevCr} format="pct" note={`${fmt(traffic.visitors)} visitors`} />
        <StatTile label="Ad spend" value={ads.spend} prev={prevAds.spend} format="eur" upIsGood={false} />
        <StatTile label="MER" value={mer} prev={prevMer} format="x" note="revenue ÷ ad spend" />
        <StatTile label="New email sign-ups" value={email.signups} note={email.listSize != null ? `list ${fmt(email.listSize)}` : undefined} />
      </div>

      <ChartCard title="Revenue per day" sub="This period against the one before, day by day." wide table={{ head: ["Date", "This period", "Previous period"], rows: rev.map((p, i) => [p.date, fmt(p.value, "eur"), fmt(prevRev[i]?.value, "eur")]) }}>
        <LineChart label="Revenue per day" format="eur" series={[{ name: "This period", slot: 1, points: rev }, { name: "Previous period", slot: "muted", points: prevAligned }]} />
      </ChartCard>

      <div className="ad-grid-3">
        <ChartCard title="Needs attention">
          {todo.length ? (
            <ul className="ad-bars">{todo.map((t) => <li key={t.href} style={{ gridTemplateColumns: "1fr auto" }}><Link href={t.href} className="ad-bar-label">{t.text}</Link><Link href={t.href} className="ad-note">Open</Link></li>)}</ul>
          ) : <p className="ad-empty">Nothing waiting. All caught up.</p>}
        </ChartCard>
        <ChartCard title="Best-selling colours" sub="Revenue, all products." table={{ head: ["Colour", "Units", "Revenue"], rows: colours.map((c) => [colourName(c.key)?.name ?? c.key, c.units, fmt(c.revenue, "eur")]) }}>
          <Bars label="Revenue by colour" format="eur" rows={colours.slice(0, 6).map((c) => ({ key: c.key, label: colourName(c.key)?.name ?? c.key, swatch: colourName(c.key)?.hex, value: c.revenue, note: `${c.units} units` }))} />
        </ChartCard>
        <ChartCard title="Where orders came from" sub="First-touch source on the order." table={{ head: ["Source", "Orders", "Revenue"], rows: sources.map((s) => [sourceLabel(s.key), s.orders ?? 0, fmt(s.revenue, "eur")]) }}>
          <Bars label="Revenue by source" format="eur" rows={sources.slice(0, 6).map((s) => ({ key: s.key, label: sourceLabel(s.key), value: s.revenue, note: `${s.orders} orders` }))} />
        </ChartCard>
      </div>

      <ChartCard title="Shopping funnel" sub="Unique visitors per day reaching each step." table={{ head: ["Step", "Visitors"], rows: [["Visited", traffic.visitors], ["Viewed a product", traffic.viewed], ["Added to bag", traffic.added], ["Started checkout", traffic.checkout], ["Ordered", sales.orders]] }}>
        <Funnel steps={[{ label: "Visited", value: traffic.visitors }, { label: "Viewed a product", value: traffic.viewed }, { label: "Added to bag", value: traffic.added }, { label: "Started checkout", value: traffic.checkout }, { label: "Ordered", value: sales.orders }]} />
      </ChartCard>
    </>
  );
}
