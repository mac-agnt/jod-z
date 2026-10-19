"use server";
import { revalidatePath } from "next/cache";
import { requireRole } from "../auth";
import { db, schema } from "../db";
import { audit } from "../audit";
import { shortCode } from "../crypto";
import { siteUrl } from "../site";
import { sendEmail, notifyTeam } from "../email/send";
import { templates } from "../email/templates";
import { basketTotals, casePrice, tradeRules, unitPrice, type TradeItem } from "../trade";
import { fmt } from "../format";
import { catalogueFor, retailerFor } from "./trade";

export type PlaceResult = { ok: boolean; message: string; ref?: string };

export async function placeTradeOrder(input: { id: string; cases: number }[]): Promise<PlaceResult> {
  const user = await requireRole(["retailer"], "/retailers/portal");
  if (user.role !== "retailer") return { ok: false, message: "This is a preview. Sign in as the stockist to place orders." };
  const r = await retailerFor(user);
  if (!r || r.status !== "approved") return { ok: false, message: "Your trade account is not active. Contact hello@jod-z.com." };
  if (!Array.isArray(input) || !input.length || input.length > 40) return { ok: false, message: "Your basket is empty." };

  const items = new Map((await catalogueFor(r)).map((t) => [t.id, t]));
  const lines: { item: TradeItem; cases: number }[] = [];
  for (const l of input) {
    if (!l || typeof l !== "object" || typeof l.id !== "string") return { ok: false, message: "Something in the basket changed. Refresh the page and try again." };
    const item = items.get(l.id);
    if (!item || !Number.isInteger(l.cases) || l.cases < tradeRules.minCases || l.cases > 100) return { ok: false, message: "Something in the basket changed. Refresh the page and try again." };
    if (item.stock === "Out of stock") return { ok: false, message: `${item.colourName} is out of stock. Remove it to continue.` };
    lines.push({ item, cases: l.cases });
  }
  const t = basketTotals(lines);
  const ref = `JZ-T-${shortCode(6)}`;

  await db().transaction(async (tx) => {
    const [o] = await tx.insert(schema.orders).values({
      channel: "wholesale", provider: "portal", number: ref, retailerId: r.id, country: r.country === "Northern Ireland" ? "GB" : "IE",
      subtotal: t.sub, shippingTotal: t.freight, taxTotal: t.vat, total: t.total, status: "pending", wholesaleStatus: "submitted", paymentTerms: r.paymentTerms,
    }).returning({ id: schema.orders.id });
    await tx.insert(schema.orderLines).values(lines.map(({ item, cases }) => ({
      orderId: o.id, product: item.product, colour: item.colour, size: "Size run",
      title: `${item.name}, ${item.colourName}, ${cases} case${cases > 1 ? "s" : ""}`,
      quantity: cases * tradeRules.caseSize, unitPrice: unitPrice(item), total: casePrice(item) * cases,
    })));
  });

  await sendEmail(r.email, "wholesale-order", templates.wholesaleOrder(ref, r.storeName, fmt(t.total, "eur2"), `${siteUrl()}/retailers/portal#orders`));
  await notifyTeam("notify-wholesale", templates.notify(`Trade order ${ref}`, [["Store", r.storeName], ["Total inc. VAT", fmt(t.total, "eur2")], ["Terms", r.paymentTerms], ["Lines", lines.map((l) => `${l.cases} x ${l.item.colourName}`).join(", ")]], `${siteUrl()}/admin/retailers#orders`));
  await audit(user.email, "wholesale.place", ref, { total: t.total });
  revalidatePath("/retailers/portal");
  return { ok: true, message: `${ref} is with our warehouse. We confirm stock within two working days.`, ref };
}
