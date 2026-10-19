import type { MetadataRoute } from "next";
import { products } from "@/lib/products";
import { posts } from "@/lib/journal";
import { siteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const page = (path: string, priority: number, changeFrequency: "weekly" | "monthly" | "yearly" = "monthly") => ({ url: `${base}${path}`, priority, changeFrequency });
  return [
    page("/", 1, "weekly"),
    ...products.map((p) => page(`/product/${p.slug}`, 0.9, "weekly")),
    page("/sizing", 0.7),
    page("/our-story", 0.5),
    page("/journal", 0.5),
    ...posts.map((p) => ({ ...page(`/journal/${p.slug}`, 0.4, "yearly"), lastModified: p.date })),
    page("/faq", 0.5),
    page("/delivery-returns", 0.5),
    page("/contact", 0.4),
    page("/affiliates", 0.4),
    page("/retailers", 0.4),
    page("/privacy", 0.2, "yearly"),
    page("/cookies", 0.2, "yearly"),
    page("/terms", 0.2, "yearly"),
    page("/accessibility", 0.2, "yearly"),
  ];
}
