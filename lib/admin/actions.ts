"use server";
import { revalidatePath } from "next/cache";
import { eq, inArray } from "drizzle-orm";
const isId = (v: unknown): v is string => typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(v);
import { requireRole } from "../auth";
import { db, schema } from "../db";
import { integrations, isProd } from "../env";
import { audit } from "../audit";
import { siteUrl } from "../site";
import { sendEmail } from "../email/send";
import { templates } from "../email/templates";
import { createDiscountCode } from "../shopify/admin";
import { runSync } from "../sync";
import { clearDemo, seedDemo } from "../demo/seed";
import type { WholesaleStatus } from "../db/schema";

// Every action re-checks the admin role: server actions are public
// endpoints, whatever page they are rendered on.

export type ActionResult = { ok: boolean; message: string };
const done = (message: string): ActionResult => { revalidatePath("/admin", "layout"); return { ok: true, message }; };

async function admin() {
  return requireRole(["admin"], "/admin");
}

const asciiUpper = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z]/g, "").toUpperCase();

async function freeCode(name: string, pct: number) {
  const stem = (asciiUpper(name.split(" ")[0]) || "RIDER").slice(0, 10);
  for (let i = 0; i < 50; i++) {
    const code = `${stem}${i ? i + 1 : ""}${pct}`;
    const [taken] = await db().select({ id: schema.ambassadors.id }).from(schema.ambassadors).where(eq(schema.ambassadors.code, code)).limit(1);
    if (!taken) return code;
  }
  throw new Error("No free code");
}

export async function decideAmbassador(id: string, decision: "approve" | "reject" | "pause" | "resume"): Promise<ActionResult> {
  const me = await admin();
  if (!["approve", "reject", "pause", "resume"].includes(decision) || !isId(id)) return { ok: false, message: "Unknown decision." };
  const [a] = await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.id, id)).limit(1);
  if (!a) return { ok: false, message: "Not found." };
  if ((decision === "approve" || decision === "resume") && a.status === "awaiting_guardian") return { ok: false, message: "A parent or guardian has not agreed yet." };
  if (decision === "resume" && a.status !== "paused") return { ok: false, message: "Only paused ambassadors can be resumed." };

  if (decision === "approve") {
    const code = a.code ?? (await freeCode(a.name, a.discountPct));
    let shopifyId = a.shopifyDiscountId;
    let note = "";
    if (!shopifyId && integrations().shopifyAdmin) {
      try { shopifyId = await createDiscountCode(code, a.discountPct, `Ambassador: ${a.name}`); }
      catch (e) { note = ` Shopify did not create the code (${e instanceof Error ? e.message : "error"}): add ${code} at ${a.discountPct}% off in Shopify.`; }
    } else if (!shopifyId) note = ` Add ${code} at ${a.discountPct}% off in Shopify Discounts, or connect the Shopify Admin API to do it automatically.`;
    await db().update(schema.ambassadors).set({ status: "approved", code, shopifyDiscountId: shopifyId, decidedAt: new Date() }).where(eq(schema.ambassadors.id, id));
    await sendEmail(a.email, "ambassador-approved", templates.ambassadorApproved(a.name, code, a.discountPct, `${siteUrl()}/affiliates`));
    await audit(me.email, "ambassador.approve", a.id, { code });
    return done(`Approved with code ${code}.${note}`);
  }
  const status = decision === "reject" ? "rejected" : decision === "pause" ? "paused" : "approved";
  await db().update(schema.ambassadors).set({ status, decidedAt: new Date() }).where(eq(schema.ambassadors.id, id));
  await audit(me.email, `ambassador.${decision}`, a.id);
  return done(decision === "pause" ? "Paused. Their code still works in Shopify until you disable it there." : `Marked ${status}.`);
}

export async function decideRetailer(id: string, decision: "approve" | "reject" | "pause"): Promise<ActionResult> {
  const me = await admin();
  if (!["approve", "reject", "pause"].includes(decision) || !isId(id)) return { ok: false, message: "Unknown decision." };
  const [r] = await db().select().from(schema.retailers).where(eq(schema.retailers.id, id)).limit(1);
  if (!r) return { ok: false, message: "Not found." };
  const status = decision === "approve" ? "approved" : decision === "reject" ? "rejected" : "paused";
  await db().update(schema.retailers).set({ status, decidedAt: new Date() }).where(eq(schema.retailers.id, id));
  if (decision === "approve") await sendEmail(r.email, "retailer-approved", templates.retailerApproved(r.contactName, `${siteUrl()}/retailers`));
  await audit(me.email, `retailer.${decision}`, r.id);
  return done(decision === "approve" ? `${r.storeName} approved and emailed.` : `${r.storeName} marked ${status}.`);
}

export async function updateRetailerTerms(id: string, form: FormData): Promise<ActionResult> {
  const me = await admin();
  if (!isId(id)) return { ok: false, message: "Not found." };
  const pct = Number(form.get("tradeDiscountPct"));
  const terms = String(form.get("paymentTerms") ?? "");
  const tier = String(form.get("tier") ?? "").slice(0, 40);
  if (!Number.isInteger(pct) || pct < 0 || pct > 70) return { ok: false, message: "Trade discount must be 0 to 70%." };
  if (!["Prepay", "Net 14", "Net 30"].includes(terms)) return { ok: false, message: "Choose payment terms." };
  await db().update(schema.retailers).set({ tradeDiscountPct: pct, paymentTerms: terms, tier: tier || "Stockist" }).where(eq(schema.retailers.id, id));
  await audit(me.email, "retailer.terms", id, { pct, terms, tier });
  return done("Terms saved.");
}

export async function setWholesaleStatus(id: string, status: WholesaleStatus): Promise<ActionResult> {
  const me = await admin();
  if (!["submitted", "confirmed", "shipped", "delivered", "cancelled"].includes(status) || !isId(id)) return { ok: false, message: "Unknown status." };
  await db().update(schema.orders).set({ wholesaleStatus: status, updatedAt: new Date() }).where(eq(schema.orders.id, id));
  await audit(me.email, "wholesale.status", id, { status });
  return done(`Order marked ${status}.`);
}

export async function setMessageStatus(id: string, status: "new" | "replied" | "closed"): Promise<ActionResult> {
  await admin();
  if (!["new", "replied", "closed"].includes(status) || !isId(id)) return { ok: false, message: "Unknown status." };
  await db().update(schema.contactMessages).set({ status }).where(eq(schema.contactMessages.id, id));
  return done(`Marked ${status}.`);
}

export async function syncNow(): Promise<ActionResult> {
  const me = await admin();
  const r = await runSync();
  await audit(me.email, "sync.manual");
  const failed = r.filter((x) => !x.ok);
  revalidatePath("/admin", "layout");
  return failed.length ? { ok: false, message: `Failed: ${failed.map((f) => `${f.source} (${f.message})`).join("; ")}` } : { ok: true, message: `Synced ${r.map((x) => x.source).join(", ")}.` };
}

export async function loadDemoData(): Promise<ActionResult> {
  const me = await admin();
  if (isProd) return { ok: false, message: "Demo data is disabled in production." };
  await seedDemo(db());
  await audit(me.email, "demo.load");
  return done("Demo data loaded.");
}

export async function removeDemoData(): Promise<ActionResult> {
  const me = await admin();
  await clearDemo(db());
  await audit(me.email, "demo.clear");
  return done("Demo data removed.");
}

/** GDPR erasure: removes everything held about one email address on this site. */
export async function erasePerson(form: FormData): Promise<ActionResult> {
  const me = await admin();
  const email = String(form.get("email") ?? "").trim().toLowerCase();
  if (!/^\S+@\S+\.\S+$/.test(email)) return { ok: false, message: "Enter an email address." };
  const counts = await db().transaction(async (tx) => {
    const s = await tx.delete(schema.subscribers).where(eq(schema.subscribers.email, email)).returning({ id: schema.subscribers.id });
    const a = await tx.delete(schema.ambassadors).where(eq(schema.ambassadors.email, email)).returning({ id: schema.ambassadors.id });
    const m = await tx.delete(schema.contactMessages).where(eq(schema.contactMessages.email, email)).returning({ id: schema.contactMessages.id });
    // Stockist rows are business records but hold a person's name and email; their orders stay for tax, unlinked.
    const r = await tx.delete(schema.retailers).where(eq(schema.retailers.email, email)).returning({ id: schema.retailers.id });
    await tx.delete(schema.emailLog).where(eq(schema.emailLog.to, email));
    await tx.update(schema.auditLog).set({ target: "[erased]" }).where(eq(schema.auditLog.target, email));
    const users = await tx.select({ id: schema.users.id }).from(schema.users).where(eq(schema.users.email, email));
    if (users.length) await tx.delete(schema.users).where(inArray(schema.users.id, users.map((u) => u.id)));
    await tx.delete(schema.loginTokens).where(eq(schema.loginTokens.email, email));
    return s.length + a.length + m.length + r.length + users.length;
  });
  await audit(me.email, "gdpr.erase", "[redacted]", { records: counts });
  return done(counts ? `Erased ${counts} record${counts > 1 ? "s" : ""}. Also remove them in Shopify and Klaviyo.` : "Nothing on this site for that email. Check Shopify and Klaviyo too.");
}
