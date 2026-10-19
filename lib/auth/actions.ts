"use server";
import { redirect } from "next/navigation";
import { requestInfo } from "../request";
import { consumeSignIn, endSession, requestSignIn } from "./index";
import { safeNext } from "./constants";
import { verifyHuman } from "../turnstile";

export type SignInState = { status: "idle" | "sent" | "error"; message?: string; devUrl?: string };

export async function signInAction(_prev: SignInState, form: FormData): Promise<SignInState> {
  const { ip } = await requestInfo();
  if (!(await verifyHuman(form.get("cf-turnstile-response"), ip))) return { status: "error", message: "Please complete the check and try again." };
  const r = await requestSignIn(String(form.get("email") ?? ""), String(form.get("next") ?? ""), ip);
  if (!r.ok) return { status: "error", message: r.error };
  return { status: "sent", devUrl: r.devUrl };
}

export async function verifyAction(form: FormData) {
  const { userAgent } = await requestInfo();
  const next = await consumeSignIn(String(form.get("token") ?? ""), userAgent);
  redirect(next ?? "/auth/verify?expired=1");
}

export async function signOutAction(form: FormData) {
  await endSession();
  redirect(safeNext(form.get("back"), "/"));
}
