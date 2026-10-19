import type { Metadata } from "next";
import Link from "next/link";
import { stills } from "@/lib/media";
import { company } from "@/lib/site";
import { ContactForm } from "@/components/forms/ContactForm";
import { Reveal } from "@/components/Reveal";
import { RevealText } from "@/components/RevealText";

export const metadata: Metadata = { title: "Contact", description: "Questions about sizing, an order or stocking Jod-Z. We reply within one working day." };

export default function Contact() {
  return (
    <main className="page">
      <div className="wrap page-grid">
        <Reveal as="header" className="page-head" load stagger={90} delay={100}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="page-visual" src={stills.door} alt="Young rider in Jod-Z leggings leading her horse from the stable" />
          <RevealText as="h1" className="serif page-title" load delay={260} step={70}>Talk to <em>us.</em></RevealText>
          <p className="muted">Sizing, orders, returns or stocking Jod-Z. A real person replies within one working day.</p>
          <p className="muted small">Email <a className="link-u" href={`mailto:${company.email}`}>{company.email}</a>. For sizing, include the rider&rsquo;s age, height and usual size. Quick answers are in the <Link href="/faq" className="link-u">FAQ</Link>.</p>
        </Reveal>
        <Reveal load delay={400}>
          <div className="contact-card">
            <ContactForm />
          </div>
        </Reveal>
      </div>
    </main>
  );
}
