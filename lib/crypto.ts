import { createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";

/** URL-safe random token, 32 bytes of entropy by default. */
export const randomToken = (bytes = 32) => randomBytes(bytes).toString("base64url");

export const sha256 = (v: string) => createHash("sha256").update(v).digest("hex");

export const hmac = (secret: string, v: string, encoding: "hex" | "base64" = "hex") => createHmac("sha256", secret).update(v).digest(encoding);

export function safeEqual(a: string, b: string) {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Human-friendly code, no lookalike characters (0/O, 1/I/L). */
export function shortCode(len = 6) {
  const abc = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  const b = randomBytes(len);
  return Array.from(b, (n) => abc[n % abc.length]).join("");
}
