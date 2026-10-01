"use client";
import { useState, type FormEvent } from "react";
import Link from "next/link";
import { Logo } from "./Logo";
import { RevealText } from "./RevealText";

type Mode = "signin" | "create" | "reset";

// Official multicolour Google "G" mark, per Google sign-in branding guidelines.
const GoogleG = () => (
  <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
    <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
    <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
    <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
    <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
  </svg>
);

const copy = {
  retailer: {
    kicker: "Retailer portal",
    create: "Open a trade account",
    signinSub: "Sign in to order stock, view invoices and download assets.",
    createSub: "For saddleries, yards and boutiques. We review every account within five working days.",
    done: "Application received. We'll email your trade terms shortly.",
    fields: [["store", "Store name", "organization"], ["name", "Your name", "name"]],
    newQ: "New stockist?",
    oldQ: "Already trading with us?",
  },
  affiliate: {
    kicker: "Partner portal",
    create: "Become a Jod-Z partner",
    signinSub: "Sign in to see your code, clicks and commission.",
    createSub: "Ride in it, film it, share your code. We review every application.",
    done: "Application received. We'll be in touch with your partner code.",
    fields: [["name", "Your name", "name"], ["handle", "Instagram or TikTok", "off"]],
    newQ: "Not a partner yet?",
    oldQ: "Already a partner?",
  },
} as const;

export function TradeAuth({ portal = "retailer" }: { portal?: keyof typeof copy }) {
  const c = copy[portal];
  const [mode, setMode] = useState<Mode>("signin");
  const [sent, setSent] = useState(false);
  const [showPw, setShowPw] = useState(false);
  // After the first switch, entrance delays drop so new fields arrive at once.
  const [live, setLive] = useState(false);

  const go = (m: Mode) => { setMode(m); setSent(false); setLive(true); };
  // Front-end only until trade auth (Shopify B2B / Supabase) is wired up.
  const submit = (e: FormEvent<HTMLFormElement>) => { e.preventDefault(); setSent(true); };

  const title = mode === "signin" ? "Welcome back" : mode === "create" ? c.create : "Reset your password";
  const sub =
    mode === "signin" ? c.signinSub
    : mode === "create" ? c.createSub
    : "Enter your email and we'll send you a reset link.";

  return (
    <div className="auth-panel">
      <div className="auth-box" data-live={live ? "" : undefined}>
        <div className="auth-logo"><Logo /></div>
        <p className="auth-kicker">{c.kicker}</p>
        <RevealText key={title} as="h1" className="serif auth-title" load delay={260} step={60}>{title}</RevealText>
        <p className="auth-sub">{sub}</p>

        {mode !== "reset" && (
          <div className="auth-tabs glass-sm" role="tablist">
            <button type="button" role="tab" aria-selected={mode === "signin"} onClick={() => go("signin")}>Sign in</button>
            <button type="button" role="tab" aria-selected={mode === "create"} onClick={() => go("create")}>{portal === "affiliate" ? "Apply" : "Create account"}</button>
          </div>
        )}

        {sent ? (
          <p className="auth-done" role="status">
            {mode === "reset" ? "Check your inbox for a reset link." : mode === "create" ? c.done : "Signed in."}
          </p>
        ) : (
          <>
            {mode !== "reset" && (
              <>
                <button type="button" className="auth-google" onClick={() => setSent(true)}>
                  <GoogleG /> <span>Continue with Google</span>
                </button>
                <div className="auth-or"><span>or</span></div>
              </>
            )}
            <form className="auth-form" onSubmit={submit}>
              {mode === "create" && (
                <div className="auth-row">
                  {c.fields.map(([n, l, a]) => (
                    <label key={n} className="auth-field"><span>{l}</span><input name={n} required autoComplete={a} /></label>
                  ))}
                </div>
              )}
              <label className="auth-field"><span>Email</span><input type="email" name="email" required autoComplete="email" placeholder={portal === "affiliate" ? "you@email.com" : "you@store.com"} /></label>
              {mode !== "reset" && (
                <label className="auth-field">
                  <span className="auth-field-top">
                    Password
                    {mode === "signin" && <button type="button" className="auth-link" onClick={() => go("reset")}>Forgot password?</button>}
                  </span>
                  <span className="auth-pw">
                    <input type={showPw ? "text" : "password"} name="password" required minLength={8} autoComplete={mode === "signin" ? "current-password" : "new-password"} />
                    <button type="button" className="auth-show" onClick={() => setShowPw(!showPw)} aria-label={showPw ? "Hide password" : "Show password"}>{showPw ? "Hide" : "Show"}</button>
                  </span>
                </label>
              )}
              {mode === "signin" && (
                <label className="auth-check"><input type="checkbox" name="remember" /> <span>Keep me signed in</span></label>
              )}
              <button type="submit" className="btn btn-light btn-block">
                <span className="btn-label">{mode === "signin" ? "Sign in" : mode === "create" ? (portal === "affiliate" ? "Apply now" : "Create account") : "Send reset link"}</span>
              </button>
            </form>
          </>
        )}

        <p className="auth-foot">
          {mode === "signin" && <>{c.newQ} <button type="button" className="auth-link" onClick={() => go("create")}>{portal === "affiliate" ? "Apply now" : "Create an account"}</button></>}
          {mode === "create" && <>{c.oldQ} <button type="button" className="auth-link" onClick={() => go("signin")}>Sign in</button></>}
          {mode === "reset" && <button type="button" className="auth-link" onClick={() => go("signin")}>Back to sign in</button>}
        </p>
        {portal === "retailer" && process.env.NODE_ENV !== "production" && (
          <Link href="/retailers/portal" className="auth-dev">Dev login</Link>
        )}
      </div>
    </div>
  );
}
