import type { Metadata } from "next";
import Link from "next/link";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { signOutAction } from "@/lib/auth/actions";
import { ambassadorFor, codeOrders } from "@/lib/portal/ambassador";
import { siteUrl } from "@/lib/site";
import { stills } from "@/lib/media";
import { dateLong, fmt } from "@/lib/format";
import { Logo } from "@/components/Logo";
import { CopyButton } from "@/components/CopyButton";

export const metadata: Metadata = { title: "Partner portal", robots: { index: false } };
export const dynamic = "force-dynamic";

const assets = [
  { src: stills.door, label: "Stable door" },
  { src: stills.saddle, label: "In the saddle" },
  { src: stills.flatlay, label: "Flat lay" },
  { src: stills.pocket, label: "Phone pocket" },
];

export default async function AmbassadorPortal({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const user = await requireRole(["ambassador"], "/affiliates/portal");
  const { id } = await searchParams;
  const a = user.role === "admin"
    ? (id && /^[0-9a-f-]{36}$/.test(id) ? (await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.id, id)).limit(1))[0] : (await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.status, "approved")).limit(1))[0])
    : await ambassadorFor(user);

  if (!a || !a.code) {
    return <main className="ap"><div className="ap-wrap"><h1 className="serif ap-title">Not active yet.</h1><p className="ap-muted">This sign-in is not linked to an approved ambassador. Email hello@jod-z.com.</p></div></main>;
  }
  const stats = await codeOrders(a.code);
  const share = `${siteUrl()}/?ref=${a.code}`;
  const rate = a.commissionPct / 100;

  return (
    <main className="ap">
      <header className="ap-top">
        <Link href="/" aria-label="Jod-Z home" className="ap-logo"><Logo /></Link>
        <span className="tp-badge">Partner portal</span>
        <form action={signOutAction}><input type="hidden" name="back" value="/affiliates" /><button type="submit" className="ap-link">Sign out</button></form>
      </header>
      <div className="ap-wrap">
        {user.role === "admin" && <p className="ap-muted" role="status">Admin preview of {a.name}.</p>}
        <p className="ap-kicker">Jod-Z Ambassador</p>
        <h1 className="serif ap-title">Hi, <em>{a.name.split(" ")[0]}.</em></h1>
        {a.status === "paused" && <p className="ap-note">Your code is paused for now. Email hello@jod-z.com if you think that is a mistake.</p>}

        <section className="ap-code" aria-label="Your code">
          <div>
            <p className="ap-muted">Your code</p>
            <p className="ap-big">{a.code}</p>
            <p className="ap-muted">Friends get {a.discountPct}% off. You earn {a.commissionPct}% of every order that uses it.</p>
          </div>
          <div className="ap-share">
            <p className="ap-muted">Your link applies the code automatically</p>
            <code>{share}</code>
            <CopyButton text={share} />
          </div>
        </section>

        <dl className="ap-stats">
          <div><dt>Orders, 30 days</dt><dd>{stats.last30.orders}</dd></div>
          <div><dt>Earned, 30 days</dt><dd>{fmt(stats.last30.revenue * rate, "eur2")}</dd></div>
          <div><dt>Orders, all time</dt><dd>{stats.all.orders}</dd></div>
          <div><dt>Earned, all time</dt><dd>{fmt(stats.all.revenue * rate, "eur2")}</dd></div>
        </dl>

        <section className="ap-sec" aria-labelledby="ap-orders">
          <h2 id="ap-orders" className="serif">Orders with your code</h2>
          {stats.rows.length ? (
            <table className="ap-table">
              <thead><tr><th>Date</th><th className="num">Order value</th><th className="num">Your commission</th></tr></thead>
              <tbody>{stats.rows.map((r, i) => <tr key={i}><td>{dateLong(r.placedAt)}</td><td className="num">{fmt(r.value, "eur2")}</td><td className="num">{fmt(r.value * rate, "eur2")}</td></tr>)}</tbody>
            </table>
          ) : <p className="ap-muted">No orders yet. Share your link in your bio and stories to get started.</p>}
          <p className="ap-muted small">Commission is worked out on the items in each order after discounts and refunds, delivery excluded{a.under16 ? ", and paid to your parent or guardian" : ""}.</p>
        </section>

        <section className="ap-sec" aria-labelledby="ap-assets">
          <h2 id="ap-assets" className="serif">Photos to share</h2>
          <div className="ap-assets">
            {assets.map((x) => (
              <a key={x.src} href={x.src} download className="ap-asset">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={x.src} alt={x.label} loading="lazy" />
                <span>{x.label}</span>
              </a>
            ))}
          </div>
        </section>

        <section className="ap-sec" aria-labelledby="ap-rules">
          <h2 id="ap-rules" className="serif">Posting guidelines</h2>
          <ul className="ap-list">
            <li>Say it is a partnership: add #ad or #ambassador to every post with your code.</li>
            <li>Ride in it, film it, keep it real. Your own yard and your own pony beat a studio every time.</li>
            <li>Tag Jod-Z so we can share the best posts.</li>
            <li>Please do not post your code on coupon sites or in ads.</li>
          </ul>
          <p className="ap-muted small">Full rules are in the <Link href="/terms#ambassadors" className="ap-link">Ambassador terms</Link>. Member since {a.decidedAt ? dateLong(a.decidedAt) : dateLong(a.createdAt)}.</p>
        </section>
      </div>
    </main>
  );
}
