import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { requireRole } from "@/lib/auth";
import { db, schema } from "@/lib/db";
import { bestsellers, catalogueFor, ordersFor, retailerFor } from "@/lib/portal/trade";
import { Portal } from "./Portal";

export const metadata: Metadata = { title: "Trade portal", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const user = await requireRole(["retailer"], "/retailers/portal");
  const { store } = await searchParams;
  // Admins can preview any stockist's portal with ?store=<id>.
  const retailer = user.role === "admin"
    ? (store && /^[0-9a-f-]{36}$/.test(store) ? (await db().select().from(schema.retailers).where(eq(schema.retailers.id, store)).limit(1))[0] : (await db().select().from(schema.retailers).where(eq(schema.retailers.status, "approved")).limit(1))[0])
    : await retailerFor(user);

  if (!retailer) {
    return <main className="page"><div className="wrap legal"><h1 className="serif page-title">No trade account.</h1><p className="lede">This sign-in is not linked to an approved stockist yet. Email hello@jod-z.com.</p></div></main>;
  }
  const [catalogue, orders, best] = await Promise.all([catalogueFor(retailer), ordersFor(retailer.id), bestsellers(6)]);
  return (
    <Portal
      account={{ firstName: retailer.contactName.split(" ")[0], store: retailer.storeName, town: retailer.town ?? "", tier: retailer.tier, terms: retailer.paymentTerms, preview: user.role === "admin" }}
      catalogue={catalogue}
      orders={orders}
      best={best}
    />
  );
}
