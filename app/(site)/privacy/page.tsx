import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { company } from "@/lib/site";

export const metadata: Metadata = { title: "Privacy policy" };

export default function Privacy() {
  const who = `${company.legalName}${company.croNumber ? ` (CRO ${company.croNumber})` : ""}, ${company.address}`;
  return (
    <LegalPage kicker="Policy" title={<>Privacy <em>policy.</em></>} lede="What we collect, why, who helps us handle it, and how to get it changed or deleted." updated="19 October 2026">
      <h2>Who we are</h2>
      <p>This site is run by {who}. We are the controller of the personal data described here. Contact us about anything in this policy at <a href={`mailto:${company.email}`}>{company.email}</a>.</p>

      <h2>What we collect and why</h2>
      <table>
        <thead><tr><th>When</th><th>What</th><th>Why, and our legal basis</th></tr></thead>
        <tbody>
          <tr><td>You place an order</td><td>Name, email, phone, delivery and billing address, order details. Payment details go straight to our payment providers; we never see full card numbers.</td><td>To take payment, deliver and handle returns (contract). To keep accounts for tax (legal obligation).</td></tr>
          <tr><td>You join our email list</td><td>Email, optional first name, where you signed up and when you agreed.</td><td>To send new colours, restocks and offers (consent, withdraw any time).</td></tr>
          <tr><td>You apply to be an ambassador</td><td>Name, email, social handle, age group; for under-16s, a parent or guardian&rsquo;s name and email.</td><td>To review the application and run the programme (contract). For under-16s we only proceed with a parent or guardian&rsquo;s consent.</td></tr>
          <tr><td>You apply for a trade account</td><td>Business and contact details, VAT number.</td><td>To assess and run the trade account (contract, legitimate interest).</td></tr>
          <tr><td>You contact us</td><td>Name, email, order number, message.</td><td>To answer you (legitimate interest).</td></tr>
          <tr><td>You browse the site</td><td>Pages viewed, approximate country, device type, and the campaign that brought you. No cookies; the visitor ID is an anonymous hash that changes every day.</td><td>To understand what helps shoppers (legitimate interest).</td></tr>
          <tr><td>You accept analytics or advertising cookies</td><td>Google Analytics and Meta Pixel identifiers and browsing events.</td><td>To measure the site and our ads (consent, change any time in Cookie settings).</td></tr>
        </tbody>
      </table>

      <h2>Children</h2>
      <p>Many of our customers are young riders, so we take care with their data. Orders are placed by an adult. To join our email list you must be 16 or over, or a parent or guardian must sign you up. Ambassador applicants under 16 need a parent or guardian to agree by email before we review or use the application; without that agreement we delete it within 30 days.</p>

      <h2>Who helps us</h2>
      <p>We share data only with providers who need it to run the shop, under contracts that require them to protect it:</p>
      <ul>
        <li><strong>Shopify</strong>: checkout, payments, orders and customer accounts.</li>
        <li><strong>Klarna and PayPal</strong>: if you choose them at checkout.</li>
        <li><strong>DPD</strong>: delivery.</li>
        <li><strong>Klaviyo</strong>: our email list.</li>
        <li><strong>Resend</strong>: account and confirmation emails.</li>
        <li><strong>Vercel</strong> and our database host: running this website.</li>
        <li><strong>Cloudflare</strong>: spam protection on our forms.</li>
        <li><strong>Sentry</strong>: error reports, without your name or email.</li>
        <li><strong>Meta and Google</strong>: only if you accept those cookies.</li>
      </ul>
      <p>Some of these providers process data outside the European Economic Area, mainly in the United States. Where they do, they rely on the EU-US Data Privacy Framework or the European Commission&rsquo;s standard contractual clauses.</p>

      <h2>How long we keep it</h2>
      <ul>
        <li>Orders and invoices: 6 years after the end of the financial year, as Irish tax law requires.</li>
        <li>Email list: until you unsubscribe. Unconfirmed sign-ups are deleted after 30 days.</li>
        <li>Ambassador and trade records: while you take part, then 2 years.</li>
        <li>Messages: 2 years.</li>
        <li>Site analytics events: 25 months.</li>
      </ul>

      <h2>Your rights</h2>
      <p>You can ask for a copy of your data, to correct it, to delete it, to restrict or object to how we use it, and to receive it in a portable format. Where we rely on consent you can withdraw it at any time: unsubscribe links are in every marketing email, and Cookie settings is in the footer of every page. Email <a href={`mailto:${company.email}`}>{company.email}</a> and we will respond within one month.</p>
      <p>If you are unhappy with how we handle your data, you can complain to the Data Protection Commission at <a href="https://www.dataprotection.ie" rel="noopener">dataprotection.ie</a>.</p>

      <h2>Cookies</h2>
      <p>See our <Link href="/cookies">cookie policy</Link> for the full list.</p>

      <h2>Changes</h2>
      <p>If we change this policy in a way that matters, we will say so on this page and, where appropriate, by email.</p>
    </LegalPage>
  );
}
