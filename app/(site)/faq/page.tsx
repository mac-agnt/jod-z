import type { Metadata } from "next";
import Link from "next/link";
import { JsonLd, LegalPage } from "@/components/LegalPage";
import { company, returnsWindowDays } from "@/lib/site";
import { delivery } from "@/lib/offer";

export const metadata: Metadata = { title: "FAQ", description: "Sizing, fabric, care, delivery and returns for Jod-Z riding leggings and breeches." };

// Plain-text answers, shared by the page and the FAQPage structured data.
const faqs: { q: string; a: string; link?: { href: string; label: string } }[] = [
  { q: "What size should I order?", a: "Leggings go by age: 2XS fits 6 to 7, XS 8 to 9, S 10 to 11, M 12 to 13 and L 14 to 15. If your rider is tall or broad for their age, size up. Jockey breeches go by waist in inches.", link: { href: "/sizing", label: "Size guide" } },
  { q: "Are they see-through?", a: "No. The fabric is a fully opaque 4-way stretch, including the white and pale colours, so they are fine for the ring." },
  { q: "What does the silicone knee grip do?", a: "It adds grip against the saddle so the rider stays secure without bulky patches. It sits on the inside of the knee where it matters." },
  { q: "How do I wash them?", a: "Machine wash cold, inside out. Skip fabric softener and line dry: heat and softener wear the grip down faster." },
  { q: "Do they have pockets?", a: "Yes, a deep thigh pocket that holds a phone or a handful of treats." },
  { q: "How long does delivery take?", a: `Ireland usually takes ${delivery.window.toLowerCase()} with tracked ${delivery.carrier}. Timings for the UK and Europe are shown at checkout.`, link: { href: "/delivery-returns", label: "Delivery and returns" } },
  { q: "Can I return or swap a size?", a: `Yes. You have ${returnsWindowDays} days from delivery to request a return. Items need to be unworn with tags on. Email us and we send a returns label.`, link: { href: "/delivery-returns", label: "How returns work" } },
  { q: "Can I pay in instalments?", a: "Yes, Klarna lets you pay in 3 interest-free payments at checkout. We also take cards, Apple Pay, Google Pay and PayPal." },
  { q: "Do you sell in shops?", a: "Yes, through selected saddleries and yard shops. Retailers can apply for a trade account online.", link: { href: "/retailers", label: "Stockist enquiries" } },
  { q: "How do I become an ambassador?", a: "Apply from the partner page. If you are under 16, a parent or guardian needs to agree by email before we review the application.", link: { href: "/affiliates", label: "Ambassador programme" } },
  { q: "Where is my order?", a: "Your shipping email has a DPD tracking link. If you cannot find it, send us your order number.", link: { href: "/track-order", label: "Track an order" } },
];

export default function Faq() {
  return (
    <LegalPage kicker="Help" title={<>Questions, <em>answered.</em></>} lede={<>Can&rsquo;t find it here? Email <a className="link-u" href={`mailto:${company.email}`}>{company.email}</a> or use the <Link className="link-u" href="/contact">contact form</Link>.</>}>
      <div className="faq">
        {faqs.map((f, i) => (
          <details key={f.q} open={i === 0}>
            <summary><span className="label">{f.q}</span></summary>
            <div className="body">{f.a} {f.link && <Link href={f.link.href} className="link-u">{f.link.label}</Link>}</div>
          </details>
        ))}
      </div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) }} />
    </LegalPage>
  );
}
