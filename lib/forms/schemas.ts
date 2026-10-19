import { z } from "zod";

// Validation shared by the server actions. Messages are shown under fields.

const name = z.string().trim().min(2, "Enter your name.").max(80, "That is too long.");
const email = z.string().trim().toLowerCase().max(160).email("Enter a valid email address.");
const opt = (max: number) => z.string().trim().max(max, "That is too long.").optional().transform((v) => (v ? v : undefined));
const yes = (msg: string) => z.literal("on", { message: msg });

export const consentCopy = {
  newsletter: "I want emails from Jod-Z about new colours, restocks and offers. I can unsubscribe at any time.",
  age: "I am 16 or over, or a parent or guardian is signing me up.",
  ambassador: "I agree to the Ambassador terms and the privacy policy.",
  retailer: "I agree that Jod-Z can store these details to review my trade application.",
};

export const subscribeSchema = z.object({
  email,
  firstName: opt(60),
  source: z.enum(["footer", "popup", "restock", "contact"]).default("footer"),
  age: yes("Please confirm this to sign up."),
});

export const ambassadorSchema = z
  .object({
    name,
    email,
    handle: opt(60).transform((v) => (v ? v.replace(/^@?/, "@") : undefined)),
    ageGroup: z.enum(["16plus", "under16"], { message: "Choose an age group." }),
    guardianName: opt(80),
    guardianEmail: opt(160),
    terms: yes("Please agree to the terms to apply."),
    source: z.enum(["popup", "partner-page"]).default("partner-page"),
  })
  .superRefine((v, ctx) => {
    if (v.ageGroup !== "under16") return;
    if (!v.guardianName || v.guardianName.length < 2) ctx.addIssue({ code: "custom", path: ["guardianName"], message: "Enter a parent or guardian's name." });
    if (!v.guardianEmail || !z.string().email().safeParse(v.guardianEmail).success) ctx.addIssue({ code: "custom", path: ["guardianEmail"], message: "Enter a parent or guardian's email." });
    else if (v.guardianEmail.toLowerCase() === v.email) ctx.addIssue({ code: "custom", path: ["guardianEmail"], message: "Use the parent or guardian's own email." });
  });

export const storeTypes = ["Saddlery or tack shop", "Equestrian centre or yard shop", "Boutique", "Online store", "Other"] as const;
export const countries = ["Ireland", "Northern Ireland", "Great Britain", "Other EU country", "Other"] as const;

export const retailerSchema = z.object({
  storeName: z.string().trim().min(2, "Enter the store name.").max(120),
  contactName: name,
  email,
  phone: opt(40),
  website: opt(200),
  storeType: z.enum(storeTypes, { message: "Choose a store type." }),
  town: z.string().trim().min(2, "Enter the town.").max(80),
  country: z.enum(countries, { message: "Choose a country." }),
  vatNumber: opt(30),
  message: opt(1500),
  consent: yes("Please agree so we can review your application."),
});

export const contactTopics = ["Order or delivery", "Sizing help", "Returns and exchanges", "Wholesale", "Ambassadors", "Something else"] as const;

export const contactSchema = z.object({
  name,
  email,
  topic: z.enum(contactTopics, { message: "Choose a topic." }),
  orderNumber: opt(40),
  message: z.string().trim().min(10, "Tell us a little more.").max(3000, "Keep it under 3000 characters."),
});

export type FormState = { status: "idle" | "ok" | "error"; message?: string; errors?: Record<string, string>; devUrl?: string };

/** First error per field, keyed by field name. */
export function fieldErrors(e: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const i of e.issues) {
    const k = String(i.path[0] ?? "form");
    out[k] ??= i.message;
  }
  return out;
}
