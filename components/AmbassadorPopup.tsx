"use client";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./Button";
import { stills } from "@/lib/media";

// Invite to the ambassador programme. Opens on every visit (each full page
// load), shortly after the loader lifts, but only once per visit: moving
// between pages does not reopen it. Never on the portal pages. Submitting
// is a placeholder until the affiliate CRM endpoint exists.
const SKIP = ["/affiliates", "/retailers"];

export function AmbassadorPopup() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const [sent, setSent] = useState("");
  const panel = useRef<HTMLDivElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || SKIP.some((p) => path.startsWith(p))) return;
    const root = document.documentElement;
    let t: ReturnType<typeof setTimeout> | undefined;
    const show = () => { t = setTimeout(() => { shown.current = true; setOpen(true); }, 900); };
    const mo = new MutationObserver(() => { if (root.dataset.loader === "done") { mo.disconnect(); show(); } });
    if (root.dataset.loader === "done") show();
    else mo.observe(root, { attributes: true, attributeFilter: ["data-loader"] });
    return () => { mo.disconnect(); clearTimeout(t); };
  }, [path]);

  useEffect(() => {
    if (!open) return;
    const back = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    panel.current?.focus();
    const onKey = (e: globalThis.KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); back?.focus(); };
  }, [open]);

  // Keep Tab inside the dialog
  const trap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panel.current) return;
    const f = panel.current.querySelectorAll<HTMLElement>("button, input");
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  const submit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSent(String(new FormData(e.currentTarget).get("email") ?? ""));
  };

  if (!open) return null;
  const close = () => setOpen(false);
  return (
    <div className="amb-root">
      <div className="amb-scrim" onClick={close} />
      <div ref={panel} className="amb" role="dialog" aria-modal="true" aria-labelledby="amb-title" tabIndex={-1} onKeyDown={trap}>
        <div className="amb-visual">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={stills.stable} alt="Young rider in Jod-Z leggings standing with her horse at the stable" />
        </div>
        <div className="amb-body">
          <button type="button" className="icon-btn amb-close" onClick={close} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
          {sent ? (
            <div className="amb-done" role="status">
              <p className="partner-kicker">Application received</p>
              <h2 id="amb-title" className="serif amb-title">You&rsquo;re on the <em>list.</em></h2>
              <p className="amb-sub">We&rsquo;ll email {sent} with your ambassador code. Share it and your friends get 10% off too.</p>
              <Button variant="gold" onClick={close}>Keep browsing</Button>
            </div>
          ) : (
            <>
              <p className="partner-kicker">Jod-Z Ambassadors</p>
              <h2 id="amb-title" className="serif amb-title">Become a Jod-Z <em>Ambassador.</em></h2>
              <p className="amb-sub">10% off all Jod-Z for you and your friends, your own rider code, and first look at new colours.</p>
              <form className="auth-form" onSubmit={submit}>
                <label className="auth-field"><span>Full name</span><input name="name" autoComplete="name" required /></label>
                <label className="auth-field"><span>Email</span><input name="email" type="email" autoComplete="email" required /></label>
                <label className="auth-field"><span>Instagram or TikTok <span className="muted">(optional)</span></span><input name="handle" placeholder="@yourhandle" /></label>
                <Button type="submit" variant="gold" block>Apply now</Button>
              </form>
              <button type="button" className="amb-no" onClick={close}>No thanks</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
