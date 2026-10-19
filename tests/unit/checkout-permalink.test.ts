import { afterEach, describe, expect, it, vi } from "vitest";

process.env.COMMERCE_MODE = "permalink";
process.env.SHOPIFY_STORE_DOMAIN = "jodz-test.myshopify.com";
delete process.env.SHOPIFY_STOREFRONT_TOKEN;

const { startCheckout } = await import("@/lib/commerce");

afterEach(() => vi.unstubAllGlobals());

describe("cart permalink checkout", () => {
  it("builds a Shopify cart link with variant ids, attribution and code", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Response.json({
      products: [
        { handle: "the-monarch-breech-navy", variants: [{ id: 501, title: "28”", available: true, option1: "28”" }] },
        { handle: "merry-berry", variants: [{ id: 701, title: "M", available: true, option1: "M" }] },
      ],
    })));
    const r = await startCheckout([
      { product: "jockey-breech", colour: "monarch-navy", size: '28"', pairs: 1, qty: 2 },
      { product: "the-jod-z", colour: "merry-berry", size: "M", pairs: 2, qty: 1 },
    ], { utmSource: "tiktok", code: "AOIFE" });
    expect(r.ok).toBe(true);
    const url = new URL(r.ok ? r.url : "");
    expect(url.host).toBe("jodz-test.myshopify.com");
    expect(url.pathname).toBe("/cart/501:2,701:2");
    expect(url.searchParams.get("attributes[_utm_source]")).toBe("tiktok");
    expect(url.searchParams.get("discount")).toBe("AOIFE");
  });
});
