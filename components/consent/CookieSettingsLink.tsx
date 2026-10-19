"use client";
import { consentNeeded, openConsentSettings } from "@/lib/consent";

export function CookieSettingsLink() {
  if (!consentNeeded()) return null;
  return <button type="button" onClick={openConsentSettings}>Cookie settings</button>;
}
