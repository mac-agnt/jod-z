import type { Metadata } from "next";
import { stills } from "@/lib/media";
import { SizeGuide } from "@/components/SizeGuide";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { RevealText } from "@/components/RevealText";

export const metadata: Metadata = { title: "Sizing | Jod-Z" };

export default function Sizing() {
  return (
    <main className="page">
      <div className="wrap page-grid">
        <Reveal as="header" className="page-head" load stagger={90} delay={100}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="page-visual" src={stills.pocket} alt="Close up of the Jod-Z high waist and phone pocket" />
          <RevealText as="h1" className="serif page-title" load delay={260} step={70}>Find your <em>fit.</em></RevealText>
          <p className="muted">Young rider sizes go by age. Jockey breeches go by waist, in inches. Measure over light clothing, then check the chart.</p>
          <div className="page-ctas">
            <Button href="/product/the-jod-z" variant="dark">Shop leggings</Button>
            <Button href="/product/jockey-breech" variant="ghost-dark">Shop breeches</Button>
          </div>
        </Reveal>
        <Reveal load stagger={140} delay={450}>
          <SizeGuide />
          <div className="faq" id="delivery">
            <details><summary><span className="label">Delivery</span></summary><div className="body">Ships to Ireland, the UK and across Europe. Rates and timings to be confirmed.</div></details>
            <details><summary><span className="label">Returns and exchanges</span></summary><div className="body">Wrong size? Exchanges are straightforward. Full returns policy to be confirmed.</div></details>
            <details><summary><span className="label">Still unsure?</span></summary><div className="body">Email <a className="link-u" href="mailto:hello@jod-z.com">hello@jod-z.com</a> with age, height and usual size and we will recommend one.</div></details>
          </div>
        </Reveal>
      </div>
    </main>
  );
}
