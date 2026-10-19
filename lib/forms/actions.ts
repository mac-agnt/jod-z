"use server";
import { redirect } from "next/navigation";
import type { z } from "zod";
import { requestInfo } from "../request";
import { rateLimit } from "../rate-limit";
import { verifyHuman } from "../turnstile";
import { ambassadorSchema, contactSchema, fieldErrors, retailerSchema, subscribeSchema, type FormState } from "./schemas";
import { applyAmbassador, applyRetailer, confirmSubscription, guardianConsent, sendContact, subscribe } from "./service";

const fail = (message: string): FormState => ({ status: "error", message });

/** Parse, bot-check, rate-limit, then run. Every public form goes through here. */
async function handle<S extends z.ZodType>(
  form: FormData,
  schema: S,
  bucket: string,
  limit: number,
  run: (v: z.infer<S>) => Promise<{ message: string; devUrl?: string }>,
): Promise<FormState> {
  // Honeypot: a field people never see. Bots fill it in.
  if (String(form.get("company_url") ?? "")) return { status: "ok", message: "Thanks." };
  const parsed = schema.safeParse(Object.fromEntries(form));
  if (!parsed.success) return { status: "error", errors: fieldErrors(parsed.error), message: "Check the highlighted fields." };
  try {
    const { ip } = await requestInfo();
    if (!(await verifyHuman(form.get("cf-turnstile-response"), ip))) return fail("Please complete the check and try again.");
    if (!(await rateLimit(`${bucket}:${ip}`, limit, 3600))) return fail("Too many attempts from this connection. Try again later.");
    const r = await run(parsed.data);
    return { status: "ok", message: r.message, devUrl: r.devUrl };
  } catch (e) {
    console.error(`form ${bucket} failed`, e);
    return fail("Something went wrong on our side. Please try again, or email hello@jod-z.com.");
  }
}

export async function subscribeAction(_: FormState, form: FormData) {
  return handle(form, subscribeSchema, "subscribe", 10, subscribe);
}

export async function ambassadorAction(_: FormState, form: FormData) {
  return handle(form, ambassadorSchema, "ambassador", 5, applyAmbassador);
}

export async function retailerAction(_: FormState, form: FormData) {
  return handle(form, retailerSchema, "retailer", 5, applyRetailer);
}

export async function contactAction(_: FormState, form: FormData) {
  return handle(form, contactSchema, "contact", 8, sendContact);
}

export async function confirmSubscriptionAction(form: FormData) {
  const ok = await confirmSubscription(String(form.get("token") ?? ""));
  redirect(ok ? "/subscribe/confirm?done=1" : "/subscribe/confirm?expired=1");
}

export async function guardianConsentAction(form: FormData) {
  const name = await guardianConsent(String(form.get("token") ?? ""));
  redirect(name ? `/ambassadors/consent?done=${encodeURIComponent(name.split(" ")[0])}` : "/ambassadors/consent?expired=1");
}
