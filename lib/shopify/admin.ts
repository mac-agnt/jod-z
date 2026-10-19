import "server-only";
import { env } from "../env";
import { ShopifyError } from "./storefront";

// Shopify Admin API (custom app token). REST for orders and products so the
// same mapper handles webhook payloads and backfills; GraphQL for discounts
// and draft orders.

const base = () => {
  if (!env.SHOPIFY_STORE_DOMAIN || !env.SHOPIFY_ADMIN_TOKEN) throw new ShopifyError("Shopify Admin API is not configured");
  return `https://${env.SHOPIFY_STORE_DOMAIN}/admin/api/${env.SHOPIFY_API_VERSION}`;
};
const headers = () => ({ "X-Shopify-Access-Token": env.SHOPIFY_ADMIN_TOKEN!, "Content-Type": "application/json" });

/** GET every page of a REST list endpoint (follows Link: rel="next"). */
export async function restAll<T>(path: string, key: string, maxPages = 40): Promise<T[]> {
  let url: string | null = `${base()}${path}`;
  const out: T[] = [];
  for (let i = 0; url && i < maxPages; i++) {
    const res: Response = await fetch(url, { headers: headers(), cache: "no-store", signal: AbortSignal.timeout(20000) });
    if (res.status === 429) { await new Promise((r) => setTimeout(r, 2000)); i--; continue; }
    if (!res.ok) throw new ShopifyError(`Admin REST ${path} HTTP ${res.status}`);
    const json = (await res.json()) as Record<string, T[]>;
    out.push(...(json[key] ?? []));
    url = res.headers.get("link")?.match(/<([^>]+)>;\s*rel="next"/)?.[1] ?? null;
  }
  return out;
}

export async function adminGraphql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${base()}/graphql.json`, { method: "POST", headers: headers(), body: JSON.stringify({ query, variables }), cache: "no-store", signal: AbortSignal.timeout(15000) });
  const json = (await res.json().catch(() => ({}))) as { data?: T; errors?: { message: string }[] };
  if (!res.ok || json.errors?.length || !json.data) throw new ShopifyError(json.errors?.map((e) => e.message).join("; ") || `Admin GraphQL HTTP ${res.status}`);
  return json.data;
}

/** A percentage-off code for an ambassador, usable by any customer. */
export async function createDiscountCode(code: string, percent: number, title: string): Promise<string> {
  type R = { discountCodeBasicCreate: { codeDiscountNode: { id: string } | null; userErrors: { field: string[]; message: string }[] } };
  const data = await adminGraphql<R>(
    `mutation($d: DiscountCodeBasicInput!) { discountCodeBasicCreate(basicCodeDiscount: $d) { codeDiscountNode { id } userErrors { field message } } }`,
    {
      d: {
        title,
        code,
        startsAt: new Date().toISOString(),
        context: { all: "ALL" },
        customerGets: { value: { percentage: percent / 100 }, items: { all: true } },
        appliesOncePerCustomer: false,
        combinesWith: { productDiscounts: false, orderDiscounts: false, shippingDiscounts: true },
      },
    },
  );
  const err = data.discountCodeBasicCreate.userErrors[0];
  if (err || !data.discountCodeBasicCreate.codeDiscountNode) throw new ShopifyError(err ? `${err.field?.join(".")}: ${err.message}` : "Discount not created");
  return data.discountCodeBasicCreate.codeDiscountNode.id;
}

/** Wholesale order as a Shopify draft order at trade discount, so Jody can invoice from Shopify. */
export async function createDraftOrder(input: { email: string; note: string; tradeDiscountPct: number; lines: { variantId: number; quantity: number }[] }): Promise<{ id: string; url: string | null }> {
  type R = { draftOrderCreate: { draftOrder: { id: string; invoiceUrl: string | null } | null; userErrors: { message: string }[] } };
  const data = await adminGraphql<R>(
    `mutation($input: DraftOrderInput!) { draftOrderCreate(input: $input) { draftOrder { id invoiceUrl } userErrors { message } } }`,
    {
      input: {
        email: input.email,
        note: input.note,
        tags: ["wholesale", "trade-portal"],
        appliedDiscount: { valueType: "PERCENTAGE", value: input.tradeDiscountPct, title: `Trade ${input.tradeDiscountPct}%` },
        lineItems: input.lines.map((l) => ({ variantId: `gid://shopify/ProductVariant/${l.variantId}`, quantity: l.quantity })),
      },
    },
  );
  const err = data.draftOrderCreate.userErrors[0]?.message;
  if (err || !data.draftOrderCreate.draftOrder) throw new ShopifyError(err ?? "Draft order not created");
  return { id: data.draftOrderCreate.draftOrder.id, url: data.draftOrderCreate.draftOrder.invoiceUrl };
}
