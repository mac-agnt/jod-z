import "server-only";
import { env } from "../env";

export class ShopifyError extends Error {}

/** Storefront API (public token from the Headless sales channel). */
export async function storefront<T>(query: string, variables: Record<string, unknown> = {}, revalidate?: number): Promise<T> {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_STOREFRONT_TOKEN) throw new ShopifyError("Storefront API is not configured");
  const res = await fetch(`https://${env.SHOPIFY_STORE_DOMAIN}/api/${env.SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": env.SHOPIFY_STOREFRONT_TOKEN },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(8000),
    ...(revalidate ? { next: { revalidate } } : { cache: "no-store" as const }),
  });
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length || !json.data) {
    throw new ShopifyError(json.errors?.map((e) => e.message).join("; ") || `Storefront HTTP ${res.status}`);
  }
  return json.data;
}

export type SfVariant = { id: string; availableForSale: boolean; quantityAvailable?: number | null; selectedOptions: { name: string; value: string }[] };

/**
 * Variants for a set of product handles. quantityAvailable needs the
 * unauthenticated_read_product_inventory scope; without it we fall back to
 * in-stock / sold-out only.
 */
export async function variantsByHandle(handles: string[], revalidate = 60): Promise<Record<string, SfVariant[]>> {
  const build = (withQty: boolean) =>
    `query {${handles.map((h, i) => ` p${i}: product(handle: ${JSON.stringify(h)}) { handle variants(first: 50) { nodes { id availableForSale ${withQty ? "quantityAvailable" : ""} selectedOptions { name value } } } }`).join("")} }`;
  type R = Record<string, { handle: string; variants: { nodes: SfVariant[] } } | null>;
  let data: R;
  try {
    data = await storefront<R>(build(true), {}, revalidate);
  } catch (e) {
    if (!(e instanceof ShopifyError) || !/quantityAvailable|access denied/i.test(e.message)) throw e;
    data = await storefront<R>(build(false), {}, revalidate);
  }
  const out: Record<string, SfVariant[]> = {};
  for (const p of Object.values(data)) if (p) out[p.handle] = p.variants.nodes;
  return out;
}

type CartCreate = { cartCreate: { cart: { checkoutUrl: string } | null; userErrors: { message: string }[] } };

export async function createCart(input: {
  lines: { merchandiseId: string; quantity: number; attributes?: { key: string; value: string }[] }[];
  attributes: { key: string; value: string }[];
  discountCodes: string[];
}): Promise<string> {
  const data = await storefront<CartCreate>(
    `mutation($input: CartInput!) { cartCreate(input: $input) { cart { checkoutUrl } userErrors { message } } }`,
    { input: { ...input, buyerIdentity: { countryCode: "IE" } } },
  );
  const err = data.cartCreate.userErrors[0]?.message;
  if (err || !data.cartCreate.cart) throw new ShopifyError(err ?? "Cart could not be created");
  return data.cartCreate.cart.checkoutUrl;
}
