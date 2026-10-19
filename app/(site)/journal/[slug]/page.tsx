import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPost, posts } from "@/lib/journal";
import { siteUrl } from "@/lib/site";
import { dateLong } from "@/lib/format";
import { JsonLd, LegalPage } from "@/components/LegalPage";
import { Button } from "@/components/Button";

type Props = { params: Promise<{ slug: string }> };

export const generateStaticParams = () => posts.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getPost((await params).slug);
  if (!p) return {};
  return { title: p.title, description: p.excerpt, openGraph: { type: "article", images: [{ url: p.image, alt: p.alt }] } };
}

export default async function Post({ params }: Props) {
  const p = getPost((await params).slug);
  if (!p) notFound();
  return (
    <LegalPage kicker="Journal" title={p.title} lede={p.excerpt} updated={undefined}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img className="journal-hero" src={p.image} alt={p.alt} />
      <p className="small muted">{dateLong(p.date)}</p>
      {p.body.map((para) => <p key={para.slice(0, 24)}>{para}</p>)}
      <div className="page-ctas" style={{ marginTop: 40 }}><Button href="/product/the-jod-z" variant="dark">Shop leggings</Button></div>
      <JsonLd data={{ "@context": "https://schema.org", "@type": "Article", headline: p.title, datePublished: p.date, image: `${siteUrl()}${p.image}`, author: { "@type": "Organization", name: "Jod-Z" }, publisher: { "@type": "Organization", name: "Jod-Z" } }} />
    </LegalPage>
  );
}
