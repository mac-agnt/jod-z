import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PDP } from "./PDP";
import { getProduct, products } from "@/lib/products";

export const generateStaticParams = () => products.map((p) => ({ slug: p.slug }));

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const p = getProduct(params.slug);
  return { title: p ? `${p.name} | Jod-Z` : "Jod-Z", description: p?.descriptor };
}

export default function Page({ params, searchParams }: { params: { slug: string }; searchParams: { colour?: string } }) {
  const product = getProduct(params.slug);
  if (!product) notFound();
  const initial = product.colourways.find((c) => c.slug === searchParams.colour) ?? product.colourways[0];
  return <PDP slug={product.slug} initialColour={initial.slug} />;
}
