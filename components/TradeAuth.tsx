"use client";
import { useActionState, useState, type ReactNode } from "react";
import { Logo } from "./Logo";
import { RevealText } from "./RevealText";
import { signInAction, type SignInState } from "@/lib/auth/actions";
import { Turnstile } from "./forms/Field";

type Mode = "signin" | "apply";

const copy = {
  retailer: {
    kicker: "Retailer portal",
    apply: "Open a trade account",
    signinSub: "Sign in to order stock, track orders and reorder in one tap.",
    applySub: "For saddleries, yards and boutiques. We review every account within five working days.",
    tab: "Apply",
    newQ: "New stockist?",
    oldQ: "Already trading with us?",
    placeholder: "you@store.com",
  },
  affiliate: {
    kicker: "Partner portal",
    apply: "Become a Jod-Z partner",
    signinSub: "Sign in to see your code, orders and commission.",
    applySub: "Ride in it, film it, share your code. We review every application.",
    tab: "Apply",
    newQ: "Not a partner yet?",
    oldQ: "Already a partner?",
    placeholder: "you@email.com",
  },
  admin: {
    kicker: "Jod-Z team",
    apply: "",
    signinSub: "Sign in with your team email to open the dashboard.",
    applySub: "",
    tab: "",
    newQ: "",
    oldQ: "",
    placeholder: "you@jod-z.com",
  },
} as const;

/**
 * Passwordless sign-in for every private area: enter an email, get a
 * one-time link. Partner areas also offer an application form.
 */
export function TradeAuth({ portal = "retailer", next, apply, denied }: { portal?: keyof typeof copy; next: string; apply?: ReactNode; denied?: boolean }) {
  const c = copy[portal];
  const [mode, setMode] = useState<Mode>("signin");
  // After the first switch, entrance delays drop so new fields arrive at once.
  const [live, setLive] = useState(false);
  const [state, action, pending] = useActionState<SignInState, FormData>(signInAction, { status: "idle" });

  const go = (m: Mode) => { setMode(m); setLive(true); };
  const title = mode === "signin" ? "Welcome back" : c.apply;
  const sub = mode === "signin" ? c.signinSub : c.applySub;

  return (
    <div className="auth-panel">
      <div className="auth-box" data-live={live ? "" : undefined}>
        <div className="auth-logo"><Logo /></div>
        <p className="auth-kicker">{c.kicker}</p>
        <RevealText key={title} as="h1" className="serif auth-title" load delay={260} step={60}>{title}</RevealText>
        <p className="auth-sub">{sub}</p>

        {apply && (
          <div className="auth-tabs glass-sm" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => go("signin")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "apply"} onClick={() => go("apply")}>{c.tab}</button>
          </div>
        )}

        {denied && mode === "signin" && <p className="auth-error" role="alert">That account cannot open this area. Sign in with a different email.</p>}

        {mode === "apply" ? apply : state.status === "sent" ? (
          <div className="auth-done" role="status">
            <p>Check your inbox. If that email has an account, a sign-in link is on its way. It works once and expires in 15 minutes.</p>
            {state.devUrl && <p className="auth-dev-link"><a href={state.devUrl}>Development only: open the sign-in link</a></p>}
          </div>
        ) : (
          <form className="auth-form" action={action}>
            <input type="hidden" name="next" value={next} />
            <label className="auth-field"><span>Email</span><input type="email" name="email" required autoComplete="email" placeholder={c.placeholder} /></label>
            <Turnstile />
            {state.status === "error" && <p className="auth-error" role="alert">{state.message}</p>}
            <button type="submit" className="btn btn-light btn-block" disabled={pending}>
              <span className="btn-label">{pending ? "Sending" : "Email me a sign-in link"}</span>
            </button>
          </form>
        )}

        {apply && (
          <p className="auth-foot">
            {mode === "signin" ? <>{c.newQ} <button type="button" className="auth-link" onClick={() => go("apply")}>Apply now</button></>
              : <>{c.oldQ} <button type="button" className="auth-link" onClick={() => go("signin")}>Sign in</button></>}
          </p>
        )}
      </div>
    </div>
  );
}
