import { desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { env, integrations, isProd } from "@/lib/env";
import { hasDemoData, lastSyncs } from "@/lib/metrics";
import { siteUrl } from "@/lib/site";
import { dateTime } from "@/lib/format";
import { erasePerson, loadDemoData, removeDemoData, syncNow } from "@/lib/admin/actions";
import { ChartCard } from "@/components/admin/charts";
import { ActionButton, ActionForm } from "@/components/admin/ActionButton";
import { Badge, PageHead } from "@/components/admin/ui";

export const metadata = { title: "Settings" };

export default async function Settings() {
  await requireRole(["admin"], "/admin/settings");
  const on = integrations();
  const [syncs, demo, log] = await Promise.all([lastSyncs(), hasDemoData(), db().select().from(schema.auditLog).orderBy(desc(schema.auditLog.createdAt)).limit(12)]);
  const sync = (s: string) => syncs.find((x) => x.source === s);
  const commerce = { shopify: "Storefront API checkout", permalink: "Shopify cart links (add a Storefront token for live stock counts)", demo: "Demo checkout, no payments", off: "Checkout off" }[on.commerce];

  const rows: { name: string; ok: boolean; partial?: boolean; does: string; vars: string; last?: string }[] = [
    { name: "Database", ok: on.database, does: "Orders, sign-ups, applications and metrics", vars: "DATABASE_URL" },
    { name: "Signing secret", ok: !!env.AUTH_SECRET, does: "Required in production for webhooks, analytics and sign-in", vars: "AUTH_SECRET" },
    { name: "Site address", ok: !!env.NEXT_PUBLIC_SITE_URL, does: "Links in emails, sitemap, structured data", vars: "NEXT_PUBLIC_SITE_URL" },
    { name: "Shopify checkout", ok: on.commerce === "shopify", partial: on.commerce === "permalink", does: commerce, vars: "SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_TOKEN" },
    { name: "Shopify Admin", ok: on.shopifyAdmin, does: "Orders, stock, ambassador codes, trade draft orders", vars: "SHOPIFY_ADMIN_TOKEN", last: "shopify" },
    { name: "Shopify webhooks", ok: on.shopifyWebhooks, does: `Orders land within seconds. Point orders/create and orders/updated at ${siteUrl()}/api/webhooks/shopify`, vars: "SHOPIFY_WEBHOOK_SECRET" },
    { name: "Meta Marketing API", ok: on.meta, does: "Spend, ROAS and creative results", vars: "META_ACCESS_TOKEN, META_AD_ACCOUNT_ID", last: "meta" },
    { name: "Meta Pixel", ok: on.pixel, does: "Ad measurement, after cookie consent", vars: "NEXT_PUBLIC_META_PIXEL_ID" },
    { name: "Google Analytics 4", ok: on.ga4, does: "Optional, after cookie consent", vars: "NEXT_PUBLIC_GA4_ID" },
    { name: "Klaviyo", ok: on.klaviyo, does: "Email list, campaigns and flows", vars: "KLAVIYO_PRIVATE_KEY, KLAVIYO_LIST_ID", last: "klaviyo" },
    { name: "Transactional email", ok: on.email, does: "Sign-in links, confirmations, team notifications", vars: "RESEND_API_KEY, EMAIL_FROM, EMAIL_NOTIFY" },
    { name: "Bot protection", ok: on.turnstile, does: "Cloudflare Turnstile on public forms", vars: "NEXT_PUBLIC_TURNSTILE_SITE_KEY, TURNSTILE_SECRET_KEY" },
    { name: "Error monitoring", ok: on.sentry, does: "Sentry alerts for crashes", vars: "NEXT_PUBLIC_SENTRY_DSN" },
    { name: "Daily sync", ok: on.cron, does: "Vercel Cron at 05:00 pulls Shopify, Meta and Klaviyo", vars: "CRON_SECRET", last: "housekeeping" },
  ];

  return (
    <>
      <PageHead title="Settings" sub="Connections, data and access.">
        <ActionButton tone="primary" action={syncNow}>Sync now</ActionButton>
      </PageHead>

      <ChartCard title="Connections" sub="Set these as environment variables in Vercel, then redeploy. docs/LAUNCH.md has the step-by-step." wide>
        <div className="ad-table-wrap"><table className="ad-table">
          <thead><tr><th>Service</th><th>Status</th><th>What it does</th><th>Variables</th><th>Last sync</th></tr></thead>
          <tbody>{rows.map((r) => {
            const s = r.last ? sync(r.last) : undefined;
            return (
              <tr key={r.name}>
                <td><strong>{r.name}</strong></td>
                <td>{r.ok ? <Badge tone="good">Connected</Badge> : r.partial ? <Badge tone="warn">Partial</Badge> : <Badge>Not set</Badge>}</td>
                <td>{r.does}</td>
                <td><code className="ad-sub" style={{ marginTop: 0 }}>{r.vars}</code></td>
                <td>{s ? <>{dateTime(s.startedAt)} {s.ok === false ? <Badge tone="bad">Failed</Badge> : s.ok ? <Badge tone="good">OK</Badge> : <Badge>Running</Badge>}{s.message && <span className="ad-sub">{s.message}</span>}</> : r.last ? "Never" : ""}</td>
              </tr>
            );
          })}</tbody>
        </table></div>
      </ChartCard>

      <div className="ad-grid-2">
        <ChartCard title="Team access">
          <p className="ad-note">These emails can sign in to this dashboard at /sign-in. Change the list with the ADMIN_EMAILS variable.</p>
          <ul className="ad-bars">{env.ADMIN_EMAILS.map((e) => <li key={e} style={{ gridTemplateColumns: "1fr" }}><span className="ad-bar-label">{e}</span></li>)}</ul>
        </ChartCard>
        <ChartCard title="Demo data">
          <p className="ad-note">{demo ? "Sample orders, ads, email and traffic are loaded so every page has something to show. Remove them before launch." : "No sample data is loaded."}</p>
          <div className="ad-actions">
            {!isProd && <ActionButton action={loadDemoData} confirm="Replace all demo data with a fresh set?">{demo ? "Reload demo data" : "Load demo data"}</ActionButton>}
            {demo && <ActionButton tone="danger" action={removeDemoData} confirm="Remove all demo data? Real data is not touched.">Remove demo data</ActionButton>}
          </div>
        </ChartCard>
        <ChartCard title="Privacy requests">
          <p className="ad-note">When someone asks to be forgotten, erase what this site holds for their email: sign-ups, ambassador records, messages and logins. Orders are kept for tax records with the email hashed. Repeat the request in Shopify and Klaviyo.</p>
          <ActionForm action={erasePerson} submit="Erase">
            <input className="ad-input" type="email" name="email" placeholder="person@email.com" required aria-label="Email to erase" style={{ minWidth: 220 }} />
          </ActionForm>
        </ChartCard>
        <ChartCard title="Recent activity">
          {log.length ? (
            <ul className="ad-bars">{log.map((l) => <li key={l.id} style={{ gridTemplateColumns: "1fr auto" }}><span className="ad-bar-label">{l.action.replace(".", ": ")}{l.target ? `, ${l.target}` : ""}</span><span className="ad-note">{dateTime(l.createdAt)}</span></li>)}</ul>
          ) : <p className="ad-empty">No activity yet.</p>}
        </ChartCard>
      </div>
    </>
  );
}
