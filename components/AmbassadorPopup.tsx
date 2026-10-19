"use client";
import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { stills } from "@/lib/media";
import { AmbassadorForm } from "./forms/AmbassadorForm";

// Invite to the ambassador programme. Opens shortly after the loader lifts,
// once per visit, never on portal or checkout pages, and stays away for two
// weeks after someone closes it or applies.
const QUIET_DAYS = 14;
const KEY = "jz-amb-closed";
const SKIP = ["/affiliates", "/retailers", "/sign-in", "/auth", "/checkout", "/subscribe", "/ambassadors"];

export function AmbassadorPopup() {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const panel = useRef<HTMLDivElement>(null);
  const shown = useRef(false);

  useEffect(() => {
    if (shown.current || SKIP.some((p) => path.startsWith(p))) return;
    try { if (Date.now() - Number(localStorage.getItem(KEY) ?? 0) < QUIET_DAYS * 86_400_000) return; } catch {}
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
    const onKey = (e: globalThis.KeyboardEvent) => { if (e.key !== "Escape") return; setOpen(false); try { localStorage.setItem(KEY, String(Date.now())); } catch {} };
    document.addEventListener("keydown", onKey);
    return () => { document.body.style.overflow = ""; document.removeEventListener("keydown", onKey); back?.focus(); };
  }, [open]);

  // Keep Tab inside the dialog
  const trap = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== "Tab" || !panel.current) return;
    const f = panel.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([type=hidden]):not([tabindex='-1']), a[href]");
    const first = f[0], last = f[f.length - 1];
    if (e.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { e.preventDefault(); last.focus(); }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
  };

  if (!open) return null;
  const close = () => {
    setOpen(false);
    try { localStorage.setItem(KEY, String(Date.now())); } catch {}
  };
  return (
    <div className="amb-root">
      <div className="amb-scrim" onClick={close} />
      <div ref={panel} className="amb" role="dialog" aria-modal="true" aria-labelledby="amb-title" tabIndex={-1} onKeyDown={trap}>
        <div className="amb-visual">
          <Image src={stills.stable} alt="Young rider in Jod-Z leggings standing with her horse at the stable" width={1122} height={1402} sizes="(max-width: 720px) 100vw, 470px" loading="eager" />
        </div>
        <div className="amb-body">
          <button type="button" className="icon-btn amb-close" onClick={close} aria-label="Close">
            <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true"><path d="M1 1l12 12M13 1L1 13" stroke="currentColor" strokeWidth="1.2" /></svg>
          </button>
          <p className="partner-kicker">Jod-Z Ambassadors</p>
          <h2 id="amb-title" className="serif amb-title">Become a Jod-Z <em>Ambassador.</em></h2>
          <p className="amb-sub">10% off all Jod-Z for you and your friends, your own rider code, and first look at new colours.</p>
          <AmbassadorForm source="popup" onDone={close} />
          <button type="button" className="amb-no" onClick={close}>No thanks</button>
        </div>
      </div>
    </div>
  );
}
