"use client";
import { useEffect } from "react";
import Link from "next/link";
import { subscribeAction } from "@/lib/forms/actions";
import { track } from "@/lib/analytics/client";
import { Honeypot, Turnstile } from "./Field";
import { useForm } from "./useForm";

export function NewsletterForm({ source = "footer" }: { source?: "footer" | "restock" | "contact" }) {
  const { state, onSubmit, pending, errors } = useForm(subscribeAction);
  useEffect(() => { if (state.status === "ok") track("sign_up"); }, [state.status]);

  if (state.status === "ok") {
    return (
      <div className="news-done" role="status">
        <p>{state.message}</p>
        {state.devUrl && <p className="auth-dev-link"><a href={state.devUrl}>Development only: open the confirmation link</a></p>}
      </div>
    );
  }

  const err = errors.email ?? errors.age ?? (state.status === "error" ? state.message : undefined);
  return (
    <form className="news" onSubmit={onSubmit} noValidate aria-label="Newsletter sign-up">
      <input type="hidden" name="source" value={source} />
      <Honeypot />
      <div className="news-row">
        <label className="sr-only" htmlFor={`news-${source}`}>Email</label>
        <input id={`news-${source}`} name="email" type="email" autoComplete="email" placeholder="Your email" required aria-invalid={!!errors.email} aria-describedby={err ? `news-err-${source}` : undefined} />
        <button type="submit" className="btn btn-light" disabled={pending}><span className="btn-label">{pending ? "Joining" : "Join"}</span></button>
      </div>
      <label className="news-check">
        <input type="checkbox" name="age" required />
        <span>I am 16 or over, or a parent or guardian is signing me up. New colours, restocks and offers. Unsubscribe any time. <Link href="/privacy">Privacy</Link></span>
      </label>
      <Turnstile />
      {err && <p id={`news-err-${source}`} className="auth-error" role="alert">{err}</p>}
    </form>
  );
}
