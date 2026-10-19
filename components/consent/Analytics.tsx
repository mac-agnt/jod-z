"use client";
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { CONSENT_EVENT, readConsent, type Consent } from "@/lib/consent";

const GA = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;

function addScript(src: string) {
  const s = document.createElement("script");
  s.src = src;
  s.async = true;
  document.head.appendChild(s);
}

function loadGa(id: string, marketing: boolean) {
  window.dataLayer = window.dataLayer || [];
  // gtag must push the arguments object itself.
  // eslint-disable-next-line prefer-rest-params
  window.gtag = function gtag() { window.dataLayer!.push(arguments); };
  window.gtag("consent", "default", { analytics_storage: "granted", ad_storage: marketing ? "granted" : "denied", ad_user_data: marketing ? "granted" : "denied", ad_personalization: marketing ? "granted" : "denied" });
  window.gtag("js", new Date());
  window.gtag("config", id, { send_page_view: false, anonymize_ip: true });
  addScript(`https://www.googletagmanager.com/gtag/js?id=${id}`);
}

function loadPixel(id: string) {
  type Fbq = ((...a: unknown[]) => void) & { callMethod?: (...a: unknown[]) => void; queue: unknown[]; loaded: boolean; version: string; push: unknown };
  const q: unknown[] = [];
  const fbq = function (...args: unknown[]) { if (fbq.callMethod) fbq.callMethod(...args); else q.push(args); } as Fbq;
  fbq.queue = q;
  fbq.push = fbq;
  fbq.loaded = true;
  fbq.version = "2.0";
  window.fbq = fbq;
  (window as unknown as { _fbq: Fbq })._fbq = fbq;
  addScript("https://connect.facebook.net/en_US/fbevents.js");
  fbq("init", id);
}

declare global { interface Window { dataLayer?: unknown[] } }

/** Loads GA4 and the Meta Pixel only once the visitor has opted in, and sends SPA page views. */
export function Analytics() {
  const path = usePathname();
  const loaded = useRef({ ga: false, pixel: false });

  useEffect(() => {
    const apply = (c: Consent | null, initial: boolean) => {
      const was = { ...loaded.current };
      if (GA && c?.analytics && !was.ga) { loadGa(GA, !!c.marketing); loaded.current.ga = true; }
      if (PIXEL && c?.marketing && !was.pixel) { loadPixel(PIXEL); loaded.current.pixel = true; }
      // Opted in mid-visit: count the page they are on (initial loads are counted below).
      if (!initial && loaded.current.ga && !was.ga) window.gtag?.("event", "page_view", { page_location: window.location.href, page_title: document.title });
      if (!initial && loaded.current.pixel && !was.pixel) window.fbq?.("track", "PageView");
      // Withdrawn after loading: scripts cannot be unloaded, so start clean.
      if ((was.ga && !c?.analytics) || (was.pixel && !c?.marketing)) window.location.reload();
    };
    apply(readConsent(), true);
    const on = (e: Event) => apply((e as CustomEvent<Consent>).detail, false);
    window.addEventListener(CONSENT_EVENT, on);
    return () => window.removeEventListener(CONSENT_EVENT, on);
  }, []);

  useEffect(() => {
    // Run after the consent effect on first load, and on every route change.
    const t = setTimeout(() => {
      if (loaded.current.ga) window.gtag?.("event", "page_view", { page_path: path, page_location: window.location.href, page_title: document.title });
      if (loaded.current.pixel) window.fbq?.("track", "PageView");
    }, 0);
    return () => clearTimeout(t);
  }, [path]);

  return null;
}
