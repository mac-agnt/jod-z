import type { Metadata } from "next";
import { stills } from "@/lib/media";
import { Button } from "@/components/Button";
import { Reveal } from "@/components/Reveal";
import { RevealText } from "@/components/RevealText";

export const metadata: Metadata = { title: "Our story", description: "Jod-Z is an Irish legwear brand for young riders, designed and tested in real yards." };

// Brand story built from what Jody's live site and journal say: Irish-owned,
// specialist legwear, tested by riders in hunting, Pony Club and Pony Games.
export default function Story() {
  return (
    <main className="page">
      <div className="wrap page-grid">
        <Reveal as="header" className="page-head" load stagger={90} delay={100}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className="page-visual" src={stills.trio} alt="Three young riders on their ponies in Jod-Z leggings" />
          <RevealText as="h1" className="serif page-title" load delay={260} step={70}>Made by <em>riders.</em></RevealText>
          <p className="muted">An Irish brand that makes one thing and makes it properly: legwear for riders who never stand still.</p>
          <div className="page-ctas"><Button href="/product/the-jod-z" variant="dark">Shop leggings</Button></div>
        </Reveal>
        <Reveal load stagger={120} delay={420} className="prose">
          <h2>Specialists, not generalists</h2>
          <p>We do not make everything. We make legwear for riding, and we work on it in real yards, on real ponies, in all weathers. Every change to the fit, the grip or the fabric comes from riders telling us what worked and what did not.</p>
          <h2>Tested where it counts</h2>
          <p>Hunting days, Pony Club rallies, Pony Games heats and the long wait at the lorry. If a pair holds up there, moving, jumping and turning hard, it holds up anywhere. That is the test every Jod-Z style has to pass.</p>
          <h2>It starts with the fabric</h2>
          <p>We choose performance fabric for how it behaves in the saddle: stretch that recovers, weight that stays opaque, and a finish that copes with heat, cold, rain and friction season after season. Then we add what riders asked for: a high waist that stays put, a silicone knee grip and a pocket big enough for a phone and a few treats.</p>
          <h2>Irish-owned</h2>
          <p>Jod-Z is designed in Ireland and ships across Ireland, the UK and Europe. When you email us, a person who rides answers.</p>
        </Reveal>
      </div>
    </main>
  );
}
