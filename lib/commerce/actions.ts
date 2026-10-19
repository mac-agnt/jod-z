"use server";
import { startCheckout } from "./index";
import type { LineInput } from "../catalog";
import type { Attribution, CheckoutResult } from "./types";
import { rateLimit } from "../rate-limit";
import { requestInfo } from "../request";
import { hasDatabase } from "../db";

export async function checkoutAction(lines: LineInput[], attribution: Attribution): Promise<CheckoutResult> {
  if (hasDatabase()) {
    const { ip } = await requestInfo();
    if (!(await rateLimit(`checkout:${ip}`, 30, 600))) return { ok: false, error: "Too many attempts. Wait a minute and try again." };
  }
  return startCheckout(lines, attribution ?? {});
}
