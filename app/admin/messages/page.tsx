import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { dateTime } from "@/lib/format";
import { setMessageStatus } from "@/lib/admin/actions";
import { ChartCard } from "@/components/admin/charts";
import { ActionButton } from "@/components/admin/ActionButton";
import { Badge, PageHead } from "@/components/admin/ui";

export const metadata = { title: "Messages" };

const FILTERS = ["new", "replied", "closed", "all"] as const;

export default async function Messages({ searchParams }: { searchParams: Promise<{ show?: string }> }) {
  await requireRole(["admin"], "/admin/messages");
  const show = (FILTERS as readonly string[]).includes((await searchParams).show ?? "") ? (await searchParams).show! : "new";
  const rows = await db().select().from(schema.contactMessages)
    .where(show === "all" ? undefined : eq(schema.contactMessages.status, show as "new" | "replied" | "closed"))
    .orderBy(desc(schema.contactMessages.createdAt)).limit(100);

  return (
    <>
      <PageHead title="Messages" sub="From the contact form. Reply from your own inbox, then mark it here.">
        <nav className="ad-range" aria-label="Filter">
          {FILTERS.map((f) => <Link key={f} href={`/admin/messages?show=${f}`} aria-current={f === show ? "true" : undefined}>{f[0].toUpperCase() + f.slice(1)}</Link>)}
        </nav>
      </PageHead>
      {rows.length === 0 && <p className="ad-empty">No {show === "all" ? "" : `${show} `}messages.</p>}
      {rows.map((m) => (
        <ChartCard key={m.id} title={`${m.topic}: ${m.name}`} sub={`${dateTime(m.createdAt)}${m.orderNumber ? `, order ${m.orderNumber}` : ""}`} wide>
          <p className="ad-msg">{m.message}</p>
          <div className="ad-actions" style={{ alignItems: "center" }}>
            <a className="ad-btn primary" href={`mailto:${m.email}?subject=${encodeURIComponent(`Re: ${m.topic}`)}`}>Reply to {m.email}</a>
            {m.status !== "replied" && <ActionButton action={setMessageStatus.bind(null, m.id, "replied")}>Mark replied</ActionButton>}
            {m.status !== "closed" && <ActionButton action={setMessageStatus.bind(null, m.id, "closed")}>Close</ActionButton>}
            {m.status !== "new" && <ActionButton action={setMessageStatus.bind(null, m.id, "new")}>Reopen</ActionButton>}
            <Badge tone={m.status === "new" ? "warn" : m.status === "replied" ? "good" : "neutral"}>{m.status}</Badge>
          </div>
        </ChartCard>
      ))}
    </>
  );
}
