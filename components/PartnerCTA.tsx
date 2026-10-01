"use client";
import { useRef } from "react";
import { usePathname } from "next/navigation";
import { Button } from "./Button";
import { RevealText } from "./RevealText";
import { stills } from "@/lib/media";
import { useReveal } from "@/lib/reveal";

const perks = [
  ["Commission", "On every order with your code"],
  ["Rider code", "A discount for your followers"],
  ["First look", "New colours before launch"],
  ["Featured", "Your videos on our channels"],
];

export function PartnerCTA() {
  const path = usePathname();
  const glass = useRef<HTMLDivElement>(null);
  useReveal(glass, path);
  if (path === "/affiliates" || path === "/retailers") return null;
  return (
    <section className="partner" aria-labelledby="partner-title">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="partner-bg" src={stills.gallop} alt="" loading="lazy" />
      <div className="partner-scrim" />
      <div ref={glass} className="partner-glass glass">
        <p className="partner-kicker">Jod-Z partner programme</p>
        <RevealText as="h2" id="partner-title" className="serif partner-title" delay={380} step={70}>
          Become a <em>Jod-Z partner</em> today.
        </RevealText>
        <p className="partner-sub">Ride in it, film it, share your code. Get paid on every order.</p>
        <ul className="partner-perks">
          {perks.map(([t, d]) => (
            <li key={t} className="glass glass-sm">
              <strong>{t}</strong>
              <span>{d}</span>
            </li>
          ))}
        </ul>
        <div className="partner-ctas">
          <Button href="/affiliates" variant="light">Apply now</Button>
          <Button href="/retailers" variant="ghost-light" arrow={false}>Stockist enquiry</Button>
        </div>
      </div>
    </section>
  );
}
