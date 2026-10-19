import "server-only";
import { env, isProd } from "../env";
import { db, schema } from "../db";
import type { Email } from "./templates";

export type SendResult = { ok: boolean; status: "sent" | "failed" | "logged" };

/**
 * Sends through Resend when configured. Without a key (local dev) the email
 * is printed to the server console and logged, so flows stay testable.
 */
export async function sendEmail(to: string, template: string, email: Email): Promise<SendResult> {
  let status: SendResult["status"] = "logged";
  let providerId: string | undefined;
  let error: string | undefined;

  if (env.RESEND_API_KEY) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ from: env.EMAIL_FROM, to: [to], subject: email.subject, html: email.html, text: email.text }),
        signal: AbortSignal.timeout(10000),
      });
      const data = (await res.json().catch(() => ({}))) as { id?: string; message?: string };
      if (res.ok) { status = "sent"; providerId = data.id; }
      else { status = "failed"; error = data.message ?? `HTTP ${res.status}`; }
    } catch (e) {
      status = "failed";
      error = e instanceof Error ? e.message : String(e);
    }
  } else if (isProd) {
    status = "failed";
    error = "RESEND_API_KEY not set";
  } else {
    console.log(`\n[email:${template}] to ${to}\n${email.subject}\n${email.text}\n`);
  }

  try {
    await db().insert(schema.emailLog).values({ to, template, subject: email.subject, status, providerId, error });
  } catch (e) {
    console.error("email log failed", e);
  }
  if (status === "failed") console.error(`email ${template} to ${to} failed: ${error}`);
  return { ok: status !== "failed", status };
}

/** Internal notification to the Jod-Z inbox, if one is configured. */
export async function notifyTeam(template: string, email: Email) {
  if (!env.EMAIL_NOTIFY) return;
  await sendEmail(env.EMAIL_NOTIFY, template, email);
}

/** In dev without an email provider, flows show links on screen instead. */
export const showDevLinks = () => !isProd && !env.RESEND_API_KEY;
