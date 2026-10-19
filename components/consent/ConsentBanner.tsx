"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { OPEN_EVENT, consentNeeded, readConsent, saveConsent } from "@/lib/consent";

/**
 * Accept and reject carry equal weight, nothing is pre-ticked, and the
 * banner stays until a choice is made (Irish DPC cookie guidance).
 */
export function ConsentBanner() {
  const [open, setOpen] = useState(false);
  const [custom, setCustom] = useState(false);
  const [analytics, setAnalytics] = useState(false);
  const [marketing, setMarketing] = useState(false);

  useEffect(() => {
    if (!consentNeeded()) return;
    const c = readConsent();
    if (!c) setOpen(true);
    const reopen = () => {
      const now = readConsent();
      setAnalytics(!!now?.analytics);
      setMarketing(!!now?.marketing);
      setCustom(true);
      setOpen(true);
    };
    window.addEventListener(OPEN_EVENT, reopen);
    return () => window.removeEventListener(OPEN_EVENT, reopen);
  }, []);

  if (!open) return null;
  const choose = (a: boolean, m: boolean) => { saveConsent(a, m); setOpen(false); };

  return (
    <div className="consent glass" role="dialog" aria-modal="false" aria-labelledby="consent-title">
      <p id="consent-title" className="consent-title">Cookies on Jod-Z</p>
      <p className="consent-text">
        We use necessary cookies to keep your bag and sign-in working. With your permission we also use analytics to improve the site and advertising cookies to measure our Meta ads. <Link href="/cookies">Cookie policy</Link>
      </p>
      {custom && (
        <div className="consent-opts">
          <label><input type="checkbox" checked disabled /> <span><strong>Necessary</strong> Bag, sign-in, security. Always on.</span></label>
          <label><input type="checkbox" checked={analytics} onChange={(e) => setAnalytics(e.target.checked)} /> <span><strong>Analytics</strong> Google Analytics, to see which pages help.</span></label>
          <label><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} /> <span><strong>Advertising</strong> Meta Pixel, to measure and improve our ads.</span></label>
        </div>
      )}
      <div className="consent-actions">
        <button type="button" className="consent-btn" onClick={() => choose(false, false)}>Reject all</button>
        {custom
          ? <button type="button" className="consent-btn" onClick={() => choose(analytics, marketing)}>Save choices</button>
          : <button type="button" className="consent-btn" onClick={() => setCustom(true)}>Choose</button>}
        <button type="button" className="consent-btn" onClick={() => choose(true, true)}>Accept all</button>
      </div>
    </div>
  );
}
