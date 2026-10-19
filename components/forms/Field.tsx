"use client";
import { useEffect, useRef, type ReactNode } from "react";

type Base = { name: string; label: ReactNode; error?: string; optional?: boolean; half?: boolean };
type InputProps = Base & { type?: "text" | "email" | "tel" | "url"; autoComplete?: string; placeholder?: string; required?: boolean; defaultValue?: string };

const describe = (name: string, error?: string) => (error ? { "aria-invalid": true, "aria-describedby": `${name}-err` } : {});
const Err = ({ name, error }: { name: string; error?: string }) => (error ? <span id={`${name}-err`} className="field-err">{error}</span> : null);
const Label = ({ label, optional }: { label: ReactNode; optional?: boolean }) => <span>{label}{optional && <span className="muted"> (optional)</span>}</span>;

export function Field({ name, label, error, optional, half, type = "text", ...rest }: InputProps) {
  return (
    <label className={`auth-field${half ? " half" : ""}`} data-invalid={error ? "" : undefined}>
      <Label label={label} optional={optional} />
      <input name={name} type={type} required={!optional} {...rest} {...describe(name, error)} />
      <Err name={name} error={error} />
    </label>
  );
}

export function Select({ name, label, error, options, optional }: Base & { options: readonly string[] }) {
  return (
    <label className="auth-field" data-invalid={error ? "" : undefined}>
      <Label label={label} optional={optional} />
      <select name={name} defaultValue="" required={!optional} {...describe(name, error)}>
        <option value="" disabled>Select</option>
        {options.map((o) => <option key={o}>{o}</option>)}
      </select>
      <Err name={name} error={error} />
    </label>
  );
}

export function TextArea({ name, label, error, optional, placeholder }: Base & { placeholder?: string }) {
  return (
    <label className="auth-field" data-invalid={error ? "" : undefined}>
      <Label label={label} optional={optional} />
      <textarea name={name} rows={4} required={!optional} placeholder={placeholder} {...describe(name, error)} />
      <Err name={name} error={error} />
    </label>
  );
}

export function Check({ name, children, error }: { name: string; children: ReactNode; error?: string }) {
  return (
    <div>
      <label className="auth-check">
        <input type="checkbox" name={name} required {...describe(name, error)} />
        <span>{children}</span>
      </label>
      <Err name={name} error={error} />
    </div>
  );
}

/** Off-screen field that only bots fill in. */
export const Honeypot = () => (
  <div aria-hidden="true" style={{ position: "absolute", left: -9999, width: 1, height: 1, overflow: "hidden" }}>
    <label>Company website<input type="text" name="company_url" tabIndex={-1} autoComplete="off" /></label>
  </div>
);

type TurnstileApi = { render: (el: HTMLElement, o: { sitekey: string; theme?: string; size?: string }) => string; remove: (id: string) => void };
declare global { interface Window { turnstile?: TurnstileApi } }

/** Cloudflare Turnstile check, rendered only when a site key is configured. */
export function Turnstile() {
  const key = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const el = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!key || !el.current) return;
    const src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    if (!document.querySelector(`script[src="${src}"]`)) {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      document.head.appendChild(s);
    }
    let id: string | undefined;
    const t = setInterval(() => {
      if (window.turnstile && el.current) {
        clearInterval(t);
        id = window.turnstile.render(el.current, { sitekey: key, theme: "dark", size: "flexible" });
      }
    }, 100);
    return () => { clearInterval(t); if (id) window.turnstile?.remove(id); };
  }, [key]);
  return key ? <div ref={el} className="turnstile" /> : null;
}
