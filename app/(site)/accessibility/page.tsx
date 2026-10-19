import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/LegalPage";
import { company } from "@/lib/site";

export const metadata: Metadata = { title: "Accessibility" };

export default function Accessibility() {
  return (
    <LegalPage kicker="Policy" title={<>Accessibility.</>} lede="We want everyone to be able to shop Jod-Z, whatever device or assistive technology they use." updated="19 October 2026">
      <h2>What we do</h2>
      <ul>
        <li>We aim to meet WCAG 2.2 level AA across the site.</li>
        <li>Every control works with a keyboard, with a visible focus outline.</li>
        <li>Colour pickers, size buttons and the bag announce their state to screen readers.</li>
        <li>Animations switch off when your device asks for reduced motion.</li>
        <li>Images that carry meaning have text descriptions.</li>
      </ul>
      <h2>Known limits</h2>
      <p>Rider videos have no audio and are decorative, so they have no captions. Checkout runs on Shopify, which publishes its own accessibility commitments.</p>
      <h2>Tell us</h2>
      <p>If anything gets in your way, email <a href={`mailto:${company.email}`}>{company.email}</a> or use the <Link href="/contact">contact form</Link>. We reply within one working day and can take an order by email if you need us to.</p>
    </LegalPage>
  );
}
