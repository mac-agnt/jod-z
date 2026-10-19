import type { Metadata } from "next";
import { LegalPage } from "@/components/LegalPage";
import { CookieSettingsLink } from "@/components/consent/CookieSettingsLink";

export const metadata: Metadata = { title: "Cookie policy" };

const necessary = [
  ["jz_consent", "Cookie", "Remembers your cookie choices.", "6 months"],
  ["jz_session", "Cookie", "Keeps team, stockist and ambassador accounts signed in.", "30 days"],
  ["jz-bag-v2", "Local storage", "Keeps your bag on this device.", "14 days"],
  ["jz-ref", "Local storage", "Applies an ambassador's code you arrived with at checkout.", "30 days"],
  ["jz-attr", "Session storage", "Remembers the page or campaign you arrived from, sent with your order.", "This visit"],
  ["jz-loaded, jz-amb-closed", "Browser storage", "Stop the intro animation and ambassador pop-up repeating.", "This visit, 14 days"],
  ["cf_*", "Cookie", "Cloudflare Turnstile spam check on forms.", "This visit"],
];
const optional = [
  ["_ga, _ga_*", "Analytics", "Google Analytics: counts visits and how the site is used.", "Up to 2 years"],
  ["_fbp, _fbc", "Advertising", "Meta Pixel: measures which ads lead to visits and orders.", "90 days"],
];

export default function Cookies() {
  return (
    <LegalPage kicker="Policy" title={<>Cookie <em>policy.</em></>} lede="We only use what the shop needs to work, unless you say yes to more." updated="19 October 2026">
      <h2>Always on</h2>
      <p>These keep the site working and secure, so they do not need consent.</p>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Kept for</th></tr></thead>
        <tbody>{necessary.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
      </table>
      <h2>Only with your permission</h2>
      <p>These load only after you choose Accept or turn them on in Cookie settings. You can change your mind at any time.</p>
      <table>
        <thead><tr><th>Name</th><th>Type</th><th>Purpose</th><th>Kept for</th></tr></thead>
        <tbody>{optional.map((r) => <tr key={r[0]}>{r.map((c, i) => <td key={i}>{c}</td>)}</tr>)}</tbody>
      </table>
      <h2>Visit counting without cookies</h2>
      <p>We count page views with an anonymous ID that is a one-way hash of your connection and browser, which changes every day and is never stored on your device. It tells us how many people visit, not who they are.</p>
      <h2>Checkout</h2>
      <p>Checkout runs on Shopify, which sets its own cookies to process your order securely. See Shopify&rsquo;s cookie policy at shopify.com/legal/cookies.</p>
      <p className="footer-legal"><CookieSettingsLink /></p>
    </LegalPage>
  );
}
