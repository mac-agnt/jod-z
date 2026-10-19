import { afterEach, describe, expect, it, vi } from "vitest";

process.env.COMMERCE_MODE = "shopify";
process.env.SHOPIFY_STORE_DOMAIN = "jodz-test.myshopify.com";
process.env.SHOPIFY_STOREFRONT_TOKEN = "public-token";

const { startCheckout, getAvailability } = await import("@/lib/commerce");

const navy = "admiral-navy-the-ultimate-equestrian-riding-legging";
const variants = (handle: string) => ({
  handle,
  variants: { nodes: ["2XS", "XS", "S", "M", "L"].map((s, i) => ({ id: `gid://shopify/ProductVariant/${handle.length}${i}`, availableForSale: s !== "L", quantityAvailable: s === "M" ? 2 : 10, selectedOptions: [{ name: "Accessory size", value: s }] })) },
});

type Call = { query: string; variables: { input?: { lines: { merchandiseId: string; quantity: number }[]; attributes: { key: string; value: string }[]; discountCodes: string[] } } };
const calls: Call[] = [];

function mockShopify() {
  vi.stubGlobal("fetch", vi.fn(async (_url: string, init: RequestInit) => {
    const body = JSON.parse(String(init.body)) as Call;
    calls.push(body);
    if (body.query.includes("cartCreate")) return Response.json({ data: { cartCreate: { cart: { checkoutUrl: "https://jodz-test.myshopify.com/cart/c/abc" }, userErrors: [] } } });
    const handles = [...body.query.matchAll(/handle: "([^"]+)"/g)].map((m) => m[1]);
    return Response.json({ data: Object.fromEntries(handles.map((h, i) => [`p${i}`, variants(h)])) });
  }));
}

afterEach(() => { vi.unstubAllGlobals(); calls.length = 0; });

describe("Shopify Storefront checkout", () => {
  it("maps bag lines to variants, packs to unit quantities, and passes attribution and code", async () => {
    mockShopify();
    const r = await startCheckout([{ product: "the-jod-z", colour: "admiral-navy", size: "S", pairs: 3, qty: 1 }], { utmSource: "meta", utmCampaign: "autumn", code: "rosie10" });
    expect(r).toEqual({ ok: true, url: "https://jodz-test.myshopify.com/cart/c/abc" });
    const input = calls.find((c) => c.query.includes("cartCreate"))!.variables.input!;
    expect(input.lines).toEqual([{ merchandiseId: `gid://shopify/ProductVariant/${navy.length}2`, quantity: 3, attributes: [{ key: "Pack", value: "3 pairs" }] }]);
    expect(input.attributes).toEqual(expect.arrayContaining([{ key: "_utm_source", value: "meta" }, { key: "_utm_campaign", value: "autumn" }]));
    expect(input.discountCodes).toEqual(["ROSIE10"]);
  });

  it("reads stock per colour and size", async () => {
    mockShopify();
    const a = await getAvailability("the-jod-z");
    expect(a["admiral-navy"].L).toEqual({ available: false, quantity: 10 });
    expect(a["admiral-navy"].M).toEqual({ available: true, quantity: 2 });
  });

  it("fails soft when Shopify is down", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response("boom", { status: 502 })));
    expect(await getAvailability("the-jod-z")).toEqual({});
    const r = await startCheckout([{ product: "the-jod-z", colour: "admiral-navy", size: "S", pairs: 1, qty: 1 }], {});
    expect(r.ok).toBe(false);
  });
});
