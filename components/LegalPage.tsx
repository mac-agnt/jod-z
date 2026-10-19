import type { ReactNode } from "react";
import { Reveal } from "./Reveal";

/** Shared layout for help and policy pages. */
export function LegalPage({ kicker, title, lede, updated, children }: { kicker?: string; title: ReactNode; lede?: ReactNode; updated?: string; children: ReactNode }) {
  return (
    <main className="page">
      <div className="wrap legal">
        <Reveal load stagger={80} delay={80}>
          {kicker && <p className="label gold">{kicker}</p>}
          <h1 className="serif page-title">{title}</h1>
          {lede && <p className="lede">{lede}</p>}
          {updated && <p className="small muted">Last updated {updated}</p>}
        </Reveal>
        <div className="prose">{children}</div>
      </div>
    </main>
  );
}

/** Structured data for search engines. Escapes < so content cannot break out of the tag. */
export function JsonLd({ data }: { data: object }) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, "\\u003c") }} />;
}
