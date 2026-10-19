import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { db, schema } from "@/lib/db";
import { commerceMode } from "@/lib/env";
import { formatPrice } from "@/lib/products";
import { Button } from "@/components/Button";
import { ClearBag } from "@/components/ClearBag";

export const metadata: Metadata = { title: "Order placed", robots: { index: false } };

// Confirmation for the local demo checkout. Only reachable in demo mode:
// real orders complete on Shopify's checkout.
export default async function DemoOrder({ params }: { params: Promise<{ id: string }> }) {
  if (commerceMode() !== "demo") notFound();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();
  const [order] = await db().select().from(schema.orders).where(eq(schema.orders.id, id)).limit(1);
  if (!order) notFound();
  const lines = await db().select().from(schema.orderLines).where(eq(schema.orderLines.orderId, id));

  return (
    <main className="page">
      <ClearBag />
      <div className="wrap legal">
        <p className="label gold">Demo checkout, no payment taken</p>
        <h1 className="serif page-title">Order {order.number} <em>placed.</em></h1>
        <p className="muted">In production this step is Shopify&rsquo;s secure checkout. This demo order appears in the dashboard so the reporting can be tested end to end.</p>
        <ul className="demo-lines">
          {lines.map((l) => (
            <li key={l.id}><span>{l.title}</span><span>{formatPrice(l.total)}</span></li>
          ))}
          {order.discountTotal > 0 && <li><span>Discount {order.discountCodes.join(", ")}</span><span>&minus;{formatPrice(order.discountTotal)}</span></li>}
          <li className="demo-total"><span>Total</span><span>{formatPrice(order.total)}</span></li>
        </ul>
        <div className="page-ctas">
          <Button href="/" variant="dark">Back to the shop</Button>
          <Button href="/admin/sales" variant="ghost-dark">See it in the dashboard</Button>
        </div>
      </div>
    </main>
  );
}
