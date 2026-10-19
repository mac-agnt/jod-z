import { requireRole } from "@/lib/auth";
import { getRange } from "@/lib/metrics/range";
import { salesKpis, trafficBy, trafficKpis, visitorsByDay } from "@/lib/metrics";
import { fmt, sourceLabel } from "@/lib/format";
import { Bars, ChartCard, Funnel, LineChart, Split } from "@/components/admin/charts";
import { PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Traffic" };

const COUNTRIES: Record<string, string> = { IE: "Ireland", GB: "United Kingdom", DE: "Germany", FR: "France", NL: "Netherlands", ES: "Spain", US: "United States" };

export default async function Traffic({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin"], "/admin/traffic");
  const r = getRange((await searchParams).range);
  const [t, p, s, ps, days, sources, pages, devices, countries] = await Promise.all([
    trafficKpis(r.start, r.end), trafficKpis(r.prevStart, r.prevEnd), salesKpis(r.start, r.end), salesKpis(r.prevStart, r.prevEnd), visitorsByDay(r),
    trafficBy("source", r.start, r.end), trafficBy("page", r.start, r.end), trafficBy("device", r.start, r.end), trafficBy("country", r.start, r.end),
  ]);
  const rate = (a: number, b: number) => (b ? a / b : null);

  return (
    <>
      <PageHead title="Traffic" sub={`Visits to the site, ${r.label.toLowerCase()}. Counted without cookies, so every visitor is included.`} range={r.key} path="/admin/traffic" />
      <div className="ad-stats">
        <StatTile label="Visitors" value={t.visitors} prev={p.visitors} spark={days} note="unique per day" />
        <StatTile label="Page views" value={t.views} prev={p.views} />
        <StatTile label="Conversion rate" value={rate(s.orders, t.visitors)} prev={rate(ps.orders, p.visitors)} format="pct" />
        <StatTile label="Add-to-bag rate" value={rate(t.added, t.visitors)} prev={rate(p.added, p.visitors)} format="pct" />
        <StatTile label="Checkout to order" value={rate(s.orders, t.checkout)} prev={rate(ps.orders, p.checkout)} format="pct" />
      </div>

      <ChartCard title="Visitors per day" wide table={{ head: ["Date", "Visitors"], rows: days.map((d) => [d.date, d.value]) }}>
        <LineChart label="Visitors per day" series={[{ name: "Visitors", slot: 1, points: days }]} />
      </ChartCard>

      <div className="ad-grid-2">
        <ChartCard title="Shopping funnel" sub="Unique visitors per day at each step." table={{ head: ["Step", "Visitors"], rows: [["Visited", t.visitors], ["Viewed a product", t.viewed], ["Added to bag", t.added], ["Started checkout", t.checkout], ["Ordered", s.orders]] }}>
          <Funnel steps={[{ label: "Visited", value: t.visitors }, { label: "Viewed a product", value: t.viewed }, { label: "Added to bag", value: t.added }, { label: "Started checkout", value: t.checkout }, { label: "Ordered", value: s.orders }]} />
        </ChartCard>
        <ChartCard title="Sources" sub="UTM source, else the referring site." table={{ head: ["Source", "Visitors"], rows: sources.map((x) => [sourceLabel(x.key), x.value]) }}>
          <Bars label="Visitors by source" rows={sources.map((x) => ({ key: x.key, label: sourceLabel(x.key), value: x.value }))} />
        </ChartCard>
        <ChartCard title="Top pages" sub="Page views." table={{ head: ["Page", "Views"], rows: pages.map((x) => [x.key, x.value]) }}>
          <Bars label="Views by page" rows={pages.map((x) => ({ key: x.key, label: x.key, value: x.value }))} />
        </ChartCard>
        <div style={{ display: "grid", gap: 16, alignContent: "start" }}>
          <ChartCard title="Devices" table={{ head: ["Device", "Visitors"], rows: devices.map((x) => [x.key, x.value]) }}>
            <Split label="Visitors by device" parts={devices.map((x) => ({ label: x.key.replace(/^\w/, (c) => c.toUpperCase()), value: x.value }))} />
          </ChartCard>
          <ChartCard title="Countries" table={{ head: ["Country", "Visitors"], rows: countries.map((x) => [COUNTRIES[x.key] ?? x.key, x.value]) }}>
            <Bars label="Visitors by country" rows={countries.slice(0, 6).map((x) => ({ key: x.key, label: COUNTRIES[x.key] ?? x.key, value: x.value }))} />
          </ChartCard>
        </div>
      </div>
      <p className="ad-note">Visitors are counted with a daily-changing anonymous ID (no cookies, no personal data), so the same person on two days counts twice. Google Analytics, when connected, only sees visitors who accept cookies, so its numbers will be lower. {fmt(t.views)} page views recorded in this period.</p>
    </>
  );
}
