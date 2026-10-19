import "server-only";
import { and, eq, isNull, lt } from "drizzle-orm";
import { db, schema } from "../db";
import { env } from "../env";
import { randomToken, sha256 } from "../crypto";
import { siteUrl } from "../site";
import { sendEmail, notifyTeam, showDevLinks } from "../email/send";
import { templates } from "../email/templates";
import { subscribeToList } from "../klaviyo";
import { consentCopy, type ambassadorSchema, type contactSchema, type retailerSchema, type subscribeSchema } from "./schemas";
import type { z } from "zod";

// Business logic behind the public forms. No request objects in here, so
// it is unit-testable; the server actions add bot and rate-limit checks.

type Result = { message: string; devUrl?: string };
const admin = (path: string) => `${siteUrl()}/admin${path}`;

export async function subscribe(v: z.infer<typeof subscribeSchema>): Promise<Result> {
  const [existing] = await db().select().from(schema.subscribers).where(eq(schema.subscribers.email, v.email)).limit(1);
  if (existing?.status === "subscribed") return { message: "You are on the list. Watch your inbox for new colours." };

  if (env.KLAVIYO_PRIVATE_KEY && env.KLAVIYO_LIST_ID) {
    await subscribeToList(v.email, v.firstName, v.source);
    await db().insert(schema.subscribers)
      // Klaviyo sends and records the double opt-in; here it stays pending.
      .values({ email: v.email, firstName: v.firstName, source: v.source, status: "pending", ageConfirmed: true, consentText: consentCopy.newsletter, klaviyoSyncedAt: new Date() })
      .onConflictDoUpdate({ target: schema.subscribers.email, set: { status: "pending", unsubscribedAt: null, consentAt: new Date(), klaviyoSyncedAt: new Date() } });
    return { message: "Check your inbox to confirm your email." };
  }

  // No Klaviyo: run double opt-in ourselves.
  const token = randomToken();
  await db().insert(schema.subscribers)
    .values({ email: v.email, firstName: v.firstName, source: v.source, status: "pending", ageConfirmed: true, consentText: consentCopy.newsletter, confirmTokenHash: sha256(token) })
    .onConflictDoUpdate({ target: schema.subscribers.email, set: { status: "pending", confirmTokenHash: sha256(token), consentAt: new Date(), unsubscribedAt: null } });
  const url = `${siteUrl()}/subscribe/confirm?token=${token}`;
  await sendEmail(v.email, "subscribe-confirm", templates.confirmSubscription(url));
  return { message: "Check your inbox to confirm your email.", devUrl: showDevLinks() ? url : undefined };
}

export async function confirmSubscription(token: string): Promise<boolean> {
  const [row] = await db().update(schema.subscribers)
    .set({ status: "subscribed", confirmedAt: new Date(), confirmTokenHash: null })
    .where(and(eq(schema.subscribers.confirmTokenHash, sha256(token)), eq(schema.subscribers.status, "pending")))
    .returning({ id: schema.subscribers.id });
  return !!row;
}

export async function applyAmbassador(v: z.infer<typeof ambassadorSchema>): Promise<Result> {
  const [existing] = await db().select().from(schema.ambassadors).where(eq(schema.ambassadors.email, v.email)).limit(1);
  // Same reply as a new application, so the form cannot be used to check who is an ambassador.
  if (existing && existing.status !== "rejected") return { message: `Thanks, ${v.name.split(" ")[0]}. We review every application and will email you. Already an ambassador? Use Sign in.` };

  const under16 = v.ageGroup === "under16";
  const token = under16 ? randomToken() : undefined;
  const values = {
    name: v.name,
    email: v.email,
    handle: v.handle,
    under16,
    guardianName: under16 ? v.guardianName : null,
    guardianEmail: under16 ? v.guardianEmail?.toLowerCase() : null,
    guardianTokenHash: token ? sha256(token) : null,
    guardianConsentAt: null,
    status: under16 ? ("awaiting_guardian" as const) : ("applied" as const),
    source: v.source,
    decidedAt: null,
  };
  await db().insert(schema.ambassadors).values(values).onConflictDoUpdate({ target: schema.ambassadors.email, set: values });

  if (token && v.guardianEmail) {
    const url = `${siteUrl()}/ambassadors/consent?token=${token}`;
    await sendEmail(v.guardianEmail, "guardian-consent", templates.guardianConsent(v.name, url));
    return { message: `Thanks, ${v.name.split(" ")[0]}. We have emailed ${v.guardianName ?? "your parent or guardian"} to ask for their permission. Your application goes ahead once they agree.`, devUrl: showDevLinks() ? url : undefined };
  }
  await sendEmail(v.email, "ambassador-received", templates.ambassadorReceived(v.name));
  await notifyTeam("notify-ambassador", templates.notify("New ambassador application", [["Name", v.name], ["Email", v.email], ["Handle", v.handle ?? "None"], ["Source", v.source]], admin("/ambassadors")));
  return { message: `Thanks, ${v.name.split(" ")[0]}. We review every application and will email your code once you are in.` };
}

/** A parent or guardian agrees to an under-16 application. */
export async function guardianConsent(token: string): Promise<string | null> {
  const [a] = await db().update(schema.ambassadors)
    .set({ status: "applied", guardianConsentAt: new Date(), guardianTokenHash: null })
    .where(and(eq(schema.ambassadors.guardianTokenHash, sha256(token)), eq(schema.ambassadors.status, "awaiting_guardian")))
    .returning();
  if (!a) return null;
  await sendEmail(a.email, "ambassador-received", templates.ambassadorReceived(a.name));
  await notifyTeam("notify-ambassador", templates.notify("New ambassador application (under 16, guardian agreed)", [["Name", a.name], ["Email", a.email], ["Guardian", `${a.guardianName} <${a.guardianEmail}>`]], admin("/ambassadors")));
  return a.name;
}

export async function applyRetailer(v: z.infer<typeof retailerSchema>): Promise<Result> {
  const [existing] = await db().select({ status: schema.retailers.status }).from(schema.retailers).where(eq(schema.retailers.email, v.email)).limit(1);
  if (existing && existing.status !== "rejected") return { message: "Application received. We review every account within five working days. Already trading with us? Use Sign in." };
  const values = {
    storeName: v.storeName, contactName: v.contactName, email: v.email, phone: v.phone, website: v.website, storeType: v.storeType,
    town: v.town, country: v.country, vatNumber: v.vatNumber, message: v.message, status: "applied" as const, decidedAt: null,
  };
  await db().insert(schema.retailers).values(values).onConflictDoUpdate({ target: schema.retailers.email, set: values });
  await sendEmail(v.email, "retailer-received", templates.retailerReceived(v.storeName));
  await notifyTeam("notify-retailer", templates.notify("New stockist application", [["Store", v.storeName], ["Contact", `${v.contactName} <${v.email}>`], ["Type", v.storeType], ["Location", `${v.town}, ${v.country}`], ["Phone", v.phone ?? ""], ["Message", v.message ?? ""]], admin("/retailers")));
  return { message: "Application received. We review every account within five working days and will email your trade terms." };
}

export async function sendContact(v: z.infer<typeof contactSchema>): Promise<Result> {
  await db().insert(schema.contactMessages).values({ name: v.name, email: v.email, topic: v.topic, orderNumber: v.orderNumber, message: v.message });
  await sendEmail(v.email, "contact-receipt", templates.contactReceipt(v.name));
  await notifyTeam("notify-contact", templates.notify(`Message: ${v.topic}`, [["From", `${v.name} <${v.email}>`], ["Order", v.orderNumber ?? ""], ["Message", v.message]], admin("/messages")));
  return { message: "Thanks. Your message is with the team and we reply within one working day." };
}

/** Unconfirmed sign-ups and unconsented under-16 applications are deleted after 30 days. */
export async function purgeStale() {
  const cutoff = new Date(Date.now() - 30 * 86_400_000);
  await db().delete(schema.subscribers).where(and(eq(schema.subscribers.status, "pending"), isNull(schema.subscribers.confirmedAt), lt(schema.subscribers.consentAt, cutoff)));
  await db().delete(schema.ambassadors).where(and(eq(schema.ambassadors.status, "awaiting_guardian"), lt(schema.ambassadors.createdAt, cutoff)));
}

