import "server-only";
import { env } from "../env";

// Shopify's public storefront JSON (no token). Used by the "permalink"
// commerce mode so checkout works against the live store before the
// Storefront API token exists.

export type PublicVariant = { id: number; title: string; available: boolean; option1: string | null };
type PublicProduct = { handle: string; variants: PublicVariant[] };

export async function publicProducts(revalidate = 120): Promise<Record<string, PublicVariant[]>> {
  if (!env.SHOPIFY_STORE_DOMAIN) throw new Error("SHOPIFY_STORE_DOMAIN is not set");
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/products.json?limit=250`, {
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`products.json HTTP ${res.status}`);
  const { products } = (await res.json()) as { products: PublicProduct[] };
  return Object.fromEntries(products.map((p) => [p.handle, p.variants]));
}

/**
 * Shopify cart permalink: /cart/{variant}:{qty},... with optional discount
 * and cart attributes. Lands the shopper straight in Shopify checkout.
 */
export function cartPermalink(items: { variantId: number; quantity: number }[], attributes: Record<string, string>, discount?: string) {
  const url = new URL(`https://${env.SHOPIFY_STORE_DOMAIN}/cart/${items.map((i) => `${i.variantId}:${i.quantity}`).join(",")}`);
  for (const [k, v] of Object.entries(attributes)) url.searchParams.set(`attributes[${k}]`, v);
  if (discount) url.searchParams.set("discount", discount);
  return url.toString();
}
