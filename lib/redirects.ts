// 301s from the old Shopify theme URLs, so existing Google rankings, ad
// links and bookmarks keep working after jod-z.com points at this site.
// Handles taken from the live sitemap and /products.json (Oct 2026).

import { shopifyHandles } from "./catalog";

type Redirect = { source: string; destination: string; permanent: boolean };

const legging = (handle: string, colour: string): Redirect[] => [
  { source: `/products/${handle}`, destination: `/product/the-jod-z?colour=${colour}`, permanent: true },
  { source: `/collections/:c/products/${handle}`, destination: `/product/the-jod-z?colour=${colour}`, permanent: true },
];

// Tracksuits are live on Shopify but not on this site yet: temporary
// redirects so they can get their own page later without a stale 301.
const tracksuits = ["hunter-green-pullover-tracksuit", "the-ultimate-white-pullover-tracksuit", "coin-grey-the-ultimate-equestrian-riding-tracksuit"];

export const legacyRedirects: Redirect[] = [
  // Translated storefronts (/es, /cs) collapse to the English site.
  { source: "/:locale(es|cs)", destination: "/", permanent: true },
  { source: "/:locale(es|cs)/:path*", destination: "/:path*", permanent: true },

  ...Object.entries(shopifyHandles["the-jod-z"]).flatMap(([colour, handle]) => legging(handle, colour)),
  ...Object.entries(shopifyHandles["jockey-breech"]).flatMap(([colour, handle]) => [
    { source: `/products/${handle}`, destination: `/product/jockey-breech?colour=${colour}`, permanent: true },
    { source: `/collections/:c/products/${handle}`, destination: `/product/jockey-breech?colour=${colour}`, permanent: true },
  ]),
  ...tracksuits.flatMap((h) => [
    { source: `/products/${h}`, destination: "/", permanent: false },
    { source: `/collections/:c/products/${h}`, destination: "/", permanent: false },
  ]),

  { source: "/collections/leggings", destination: "/product/the-jod-z", permanent: true },
  { source: "/collections/jockeys", destination: "/product/jockey-breech", permanent: true },
  { source: "/collections/pull-over-riding-wear", destination: "/", permanent: false },
  { source: "/collections/:c(frontpage|all)", destination: "/", permanent: true },
  { source: "/collections", destination: "/", permanent: true },
  { source: "/products", destination: "/", permanent: true },

  { source: "/pages/contact", destination: "/contact", permanent: true },
  { source: "/pages/size-guide", destination: "/sizing", permanent: true },
  { source: "/pages/terms-and-conditions", destination: "/terms", permanent: true },
  { source: "/pages/privacy-and-refund-policy", destination: "/delivery-returns", permanent: true },
  { source: "/pages/disclaimer", destination: "/terms", permanent: true },
  { source: "/pages/track-order", destination: "/track-order", permanent: true },
  { source: "/pages/:p(wishlist|compare)", destination: "/", permanent: true },
  { source: "/policies/privacy-policy", destination: "/privacy", permanent: true },
  { source: "/policies/:p(refund-policy|shipping-policy)", destination: "/delivery-returns", permanent: true },
  { source: "/policies/terms-of-service", destination: "/terms", permanent: true },

  { source: "/blogs/news", destination: "/journal", permanent: true },
  { source: "/blogs/news/:slug", destination: "/journal/:slug", permanent: true },

  { source: "/cart", destination: "/?bag=open", permanent: false },
];
