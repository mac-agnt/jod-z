import Link from "next/link";
import { Button } from "@/components/Button";
import { VideoRoll } from "@/components/VideoRoll";
import { HeroVideo } from "@/components/HeroVideo";
import { HeroCard } from "@/components/HeroCard";
import { FilmControl } from "@/components/FilmControl";
import { ProductFeature } from "@/components/ProductFeature";
import { Reveal } from "@/components/Reveal";
import { RevealText } from "@/components/RevealText";
import { TrustBar } from "@/components/TrustBar";
import { stills } from "@/lib/media";
import { getProduct, products, reviews } from "@/lib/products";

export default function Home() {
  const legging = products[0];
  const breech = getProduct("jockey-breech");
  return (
    <main>
      {/* 1. Hero */}
      <section className="hero" aria-label="Introduction">
        <div className="hero-media">
          <HeroVideo />
        </div>
        <div className="hero-scrim" aria-hidden="true" />
        <div className="hero-grain" aria-hidden="true" />
        <div className="wrap hero-inner">
          <FilmControl target="hero-video" />
          <p className="hero-kicker">Designed and tested by riders</p>
          <h1 className="serif hero-title">
            <span className="hl"><span>Made for</span></span>{" "}
            <span className="hl"><span><em>the yard.</em></span></span>
          </h1>
          <div className="hero-base">
            <div className="hero-copy">
              <p className="hero-sub">One legging, built properly. Silicone grip, fully opaque, eleven colours.</p>
              <div className="hero-ctas">
                <Button href="/product/the-jod-z" variant="light">Shop leggings</Button>
                <Link href="#riders" className="btn btn-ghost-light btn-play">
                  <span className="play-dot" aria-hidden="true">
                    <svg width="10" height="10" viewBox="0 0 12 12"><path d="M3 1.6v8.8a.6.6 0 0 0 .9.5l7-4.4a.6.6 0 0 0 0-1L3.9 1.1a.6.6 0 0 0-.9.5z" fill="currentColor" /></svg>
                  </span>
                  <span className="btn-label">Watch riders</span>
                </Link>
              </div>
            </div>
            <HeroCard product={legging} initial="buttermilk-beige" />
          </div>
        </div>
      </section>
      <div id="hero-end" />
      <TrustBar />

      {/* 2. Rider videos */}
      <VideoRoll />

      {/* 3. The products */}
      <section className="section shop" id="shop" aria-label="The collection">
        <div className="wrap">
          <ProductFeature product={legging} initial="buttermilk-beige" />
          <div className="campaign" aria-label="Campaign">
            <Reveal as="figure" variant="clip" className="campaign-a">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={stills.door} alt="Young rider in Buttermilk Beige Jod-Z leggings leading her horse from the stable" loading="lazy" />
            </Reveal>
            <div className="campaign-b">
              <Reveal as="figure" variant="clip" delay={140}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={stills.sunset} alt="Rider cantering at sunset in Jod-Z leggings" loading="lazy" />
              </Reveal>
              <Reveal className="campaign-copy" stagger={120} delay={220}>
                <RevealText as="p" className="serif" delay={260} step={45}>Built to stay put, from the first lap of the warm-up to the last fence.</RevealText>
                <Button href="/product/the-jod-z" variant="ghost-dark">Shop leggings</Button>
              </Reveal>
            </div>
          </div>
          {breech && <ProductFeature product={breech} flip />}
          <Reveal className="proof" stagger={120}>
            {reviews.map((r) => (
              <blockquote key={r.name} className="proof-card">
                <div className="stars" role="img" aria-label="5 out of 5 stars">★★★★★</div>
                <p className="serif">&ldquo;{r.quote}&rdquo;</p>
                <footer className="label muted">{r.name}, {r.role}</footer>
              </blockquote>
            ))}
          </Reveal>
        </div>
      </section>
    </main>
  );
}
