import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PDP } from "./PDP";
import { getProduct, products } from "@/lib/products";
import { JsonLd } from "@/components/LegalPage";
import { siteUrl } from "@/lib/site";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ colour?: string }> };

export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = getProduct((await params).slug);
  if (!p) return { title: "Product" };
  const image = p.colourways[0].image;
  return { title: p.name, description: p.descriptor, alternates: { canonical: `/product/${p.slug}` }, openGraph: { title: p.name, description: p.descriptor, images: image ? [{ url: image, alt: `${p.name} in ${p.colourways[0].name}` }] : undefined } };
}

export default async function Page({ params, searchParams }: Props) {
  const product = getProduct((await params).slug);
  if (!product) notFound();
  const { colour } = await searchParams;
  const initial = product.colourways.find((c) => c.slug === colour) ?? product.colourways[0];
  const url = `${siteUrl()}/product/${product.slug}`;
  return (
    <>
      <PDP slug={product.slug} initialColour={initial.slug} />
      <JsonLd data={{
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.descriptor,
        brand: { "@type": "Brand", name: "Jod-Z" },
        url,
        image: product.colourways.filter((c) => c.image).map((c) => `${siteUrl()}${c.image}`),
        color: product.colourways.map((c) => c.name).join(", "),
        offers: { "@type": "AggregateOffer", priceCurrency: "EUR", lowPrice: product.price, highPrice: product.price, offerCount: product.colourways.length * product.sizes.length, availability: "https://schema.org/InStock", url },
      }} />
      <JsonLd data={{ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Home", item: siteUrl() }, { "@type": "ListItem", position: 2, name: product.short, item: url }] }} />
    </>
  );
}
