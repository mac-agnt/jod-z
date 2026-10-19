import Link from "next/link";
import { requireRole } from "@/lib/auth";
import { integrations } from "@/lib/env";
import { getRange } from "@/lib/metrics/range";
import { adsByDay, adsKpis, adsTable, salesKpis, type AdRow } from "@/lib/metrics";
import { fmt } from "@/lib/format";
import { ChartCard, LineChart } from "@/components/admin/charts";
import { PageHead, StatTile } from "@/components/admin/ui";

export const metadata = { title: "Meta ads" };

function AdTable({ rows, ads }: { rows: AdRow[]; ads?: boolean }) {
  if (!rows.length) return <p className="ad-empty">No spend in this period.</p>;
  return (
    <div className="ad-table-wrap">
      <table className="ad-table">
        <thead><tr><th>{ads ? "Ad" : "Campaign"}</th><th className="num">Spend</th><th className="num">Impr.</th><th className="num">CTR</th><th className="num">CPC</th><th className="num">Purchases</th><th className="num">CPA</th><th className="num">Meta revenue</th><th className="num">ROAS</th></tr></thead>
        <tbody>
          {rows.map((a) => (
            <tr key={a.id}>
              <td>
                <span style={{ display: "flex", gap: 10, alignItems: "center" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {ads && (a.thumb ? <img className="ad-thumb" src={a.thumb} alt="" /> : <span className="ad-thumb" />)}
                  <span><strong>{a.name}</strong>{ads && a.campaign && <span className="ad-sub">{a.campaign}</span>}</span>
                </span>
              </td>
              <td className="num">{fmt(a.spend, "eur")}</td>
              <td className="num">{fmt(a.impressions, "int", true)}</td>
              <td className="num">{fmt(a.impressions ? a.clicks / a.impressions : 0, "pct")}</td>
              <td className="num">{fmt(a.clicks ? a.spend / a.clicks : null, "eur2")}</td>
              <td className="num">{fmt(a.purchases)}</td>
              <td className="num">{fmt(a.purchases ? a.spend / a.purchases : null, "eur2")}</td>
              <td className="num">{fmt(a.value, "eur")}</td>
              <td className="num"><strong>{fmt(a.spend ? a.value / a.spend : null, "x")}</strong></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default async function Ads({ searchParams }: { searchParams: Promise<{ range?: string }> }) {
  await requireRole(["admin"], "/admin/ads");
  const r = getRange((await searchParams).range);
  const [k, p, days, campaigns, ads, sales, prevSales] = await Promise.all([
    adsKpis(r.start, r.end), adsKpis(r.prevStart, r.prevEnd), adsByDay(r), adsTable("campaign", r.start, r.end), adsTable("ad", r.start, r.end), salesKpis(r.start, r.end), salesKpis(r.prevStart, r.prevEnd),
  ]);
  const connected = integrations().meta;

  return (
    <>
      <PageHead title="Meta ads" sub={`Facebook and Instagram, ${r.label.toLowerCase()}.`} range={r.key} path="/admin/ads" />
      {!connected && (
        <p className="ad-note">Connect the Meta Marketing API in <Link href="/admin/settings" className="link-u">Settings</Link> to replace the sample figures with your ad account. Data refreshes daily and Meta revises the last 28 days as late conversions land.</p>
      )}
      <div className="ad-stats">
        <StatTile label="Spend" value={k.spend} prev={p.spend} format="eur" upIsGood={false} spark={days.spend} />
        <StatTile label="MER" value={k.spend ? sales.revenue / k.spend : null} prev={p.spend ? prevSales.revenue / p.spend : null} format="x" note="all shop revenue ÷ spend" />
        <StatTile label="Meta ROAS" value={k.roas} prev={p.roas} format="x" note="Meta's own attribution" />
        <StatTile label="Cost per purchase" value={k.cpa} prev={p.cpa} format="eur2" upIsGood={false} />
        <StatTile label="Click-through rate" value={k.ctr} prev={p.ctr} format="pct" />
        <StatTile label="Cost per click" value={k.cpc} prev={p.cpc} format="eur2" upIsGood={false} />
        <StatTile label="Cost per 1,000 views" value={k.cpm} prev={p.cpm} format="eur2" upIsGood={false} />
      </div>

      <ChartCard title="Spend and Meta-reported revenue" sub="Per day, in euro." wide table={{ head: ["Date", "Spend", "Meta revenue"], rows: days.spend.map((x, i) => [x.date, fmt(x.value, "eur2"), fmt(days.value[i].value, "eur2")]) }}>
        <LineChart label="Spend and Meta-reported revenue per day" format="eur" series={[{ name: "Meta-reported revenue", slot: 1, points: days.value }, { name: "Spend", slot: 2, points: days.spend }]} />
      </ChartCard>
      <p className="ad-note">Meta counts a sale when someone saw or clicked an ad inside its attribution window, so its revenue figure usually runs higher than Shopify&rsquo;s. MER (every euro taken online divided by every euro spent on ads) is the steadier number to steer budget by.</p>

      <ChartCard title="Campaigns" wide><AdTable rows={campaigns} /></ChartCard>
      <ChartCard title="Ads" sub="Which creative is doing the work." wide><AdTable rows={ads} ads /></ChartCard>
    </>
  );
}
