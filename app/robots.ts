import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

export default function robots(): MetadataRoute.Robots {
  // Keep non-production deployments (Vercel previews) out of search results.
  const live = process.env.VERCEL_ENV ? process.env.VERCEL_ENV === "production" : true;
  return {
    rules: live
      ? { userAgent: "*", allow: "/", disallow: ["/admin", "/retailers/portal", "/affiliates/portal", "/api/", "/auth/", "/checkout/", "/sign-in", "/subscribe/", "/ambassadors/"] }
      : { userAgent: "*", disallow: "/" },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
