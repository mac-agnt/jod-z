import type { Metadata } from "next";
import Link from "next/link";
import "./admin.css";
import { requireRole } from "@/lib/auth";
import { signOutAction } from "@/lib/auth/actions";
import { hasDemoData, inboxCounts } from "@/lib/metrics";
import { integrations } from "@/lib/env";
import { Logo } from "@/components/Logo";
import { AdminNav } from "@/components/admin/Nav";

export const metadata: Metadata = { title: { default: "Dashboard", template: "%s | Jod-Z dashboard" }, robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole(["admin"], "/admin");
  const [counts, demo] = await Promise.all([inboxCounts(), hasDemoData()]);
  const live = integrations();
  const connected = live.commerce === "shopify" || live.shopifyAdmin || live.meta || live.klaviyo;

  return (
    <div className="ad">
      <aside className="ad-side">
        <Link href="/admin" className="ad-brand" aria-label="Dashboard home"><Logo /><span>Dashboard</span></Link>
        <AdminNav groups={[
          { title: "Performance", items: [{ href: "/admin", label: "Overview" }, { href: "/admin/sales", label: "Sales" }, { href: "/admin/ads", label: "Meta ads" }, { href: "/admin/email", label: "Email list" }, { href: "/admin/traffic", label: "Traffic" }] },
          { title: "Operations", items: [{ href: "/admin/inventory", label: "Stock" }, { href: "/admin/messages", label: "Messages", count: counts.messages }] },
          { title: "Partners", items: [{ href: "/admin/ambassadors", label: "Ambassadors", count: counts.ambassadors }, { href: "/admin/retailers", label: "Stockists", count: counts.retailers + counts.wholesale }] },
          { title: "Setup", items: [{ href: "/admin/settings", label: "Settings" }] },
        ]} />
        <div className="ad-side-foot">
          <span title={user.email}>{user.email}</span>
          <Link href="/" target="_blank">View site</Link>
          <form action={signOutAction}><input type="hidden" name="back" value="/sign-in" /><button type="submit">Sign out</button></form>
        </div>
      </aside>
      <main className="ad-main">
        {demo && (
          <div className="ad-banner" role="status">
            <span><strong>Demo data.</strong> {connected ? "Some figures below are sample data mixed with live data." : "Shopify, Meta and Klaviyo are not connected yet, so these figures are sample data."}</span>
            <Link href="/admin/settings">Settings</Link>
          </div>
        )}
        {children}
      </main>
    </div>
  );
}
