import type { Metadata } from "next";
import Link from "next/link";
import { posts } from "@/lib/journal";
import { dateLong } from "@/lib/format";
import { Reveal } from "@/components/Reveal";
import { RevealText } from "@/components/RevealText";

export const metadata: Metadata = { title: "Journal", description: "Notes from the yard: how Jod-Z is designed, tested and made." };

export default function Journal() {
  return (
    <main className="page">
      <div className="wrap">
        <RevealText as="h1" className="serif page-title" load delay={120} step={70}>The <em>journal.</em></RevealText>
        <Reveal className="journal-grid" stagger={110} delay={260}>
          {posts.map((p) => (
            <article key={p.slug} className="journal-card">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.image} alt={p.alt} loading="lazy" />
              <p className="small muted">{dateLong(p.date)}</p>
              <h2 className="serif"><Link href={`/journal/${p.slug}`} className="more-link">{p.title}</Link></h2>
              <p className="muted">{p.excerpt}</p>
            </article>
          ))}
        </Reveal>
      </div>
    </main>
  );
}
