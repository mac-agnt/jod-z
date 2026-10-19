import { describe, expect, it } from "vitest";
import { checkLine, fromShopifyHandle, normSize, packPrice, shopifyHandles } from "@/lib/catalog";
import { getProduct, products } from "@/lib/products";

const leg = { product: "the-jod-z", colour: "admiral-navy", size: "S", pairs: 1, qty: 1 };

describe("checkLine", () => {
  it("prices packs from the server catalogue", () => {
    expect(checkLine({ ...leg, pairs: 2 })).toMatchObject({ unitPrice: 109, total: 109, units: 2 });
    expect(checkLine({ ...leg, pairs: 3, qty: 2 })).toMatchObject({ unitPrice: 149, total: 298, units: 6 });
  });
  it.each([
    ["unknown product", { ...leg, product: "nope" }],
    ["unknown colour", { ...leg, colour: "neon" }],
    ["unknown size", { ...leg, size: "XXL" }],
    ["unsupported pack", { ...leg, pairs: 4 }],
    ["breech pack", { product: "jockey-breech", colour: "monarch-navy", size: '28"', pairs: 2, qty: 1 }],
    ["zero qty", { ...leg, qty: 0 }],
    ["fractional qty", { ...leg, qty: 1.5 }],
    ["huge qty", { ...leg, qty: 500 }],
  ])("rejects %s", (_, line) => expect(checkLine(line)).toBeNull());
});

describe("Shopify mapping", () => {
  it("covers every colourway on the site", () => {
    for (const p of products) for (const c of p.colourways) expect(shopifyHandles[p.slug]?.[c.slug], `${p.slug}/${c.slug}`).toBeTruthy();
  });
  it("reverses handles", () => {
    expect(fromShopifyHandle("merry-berry")).toEqual({ product: "the-jod-z", colour: "merry-berry" });
    expect(fromShopifyHandle("hunter-green-pullover-tracksuit")).toBeNull();
  });
  it("matches curly-quote sizes", () => expect(normSize("28”")).toBe(normSize('28"')));
  it("falls back to unit price for non-pack products", () => expect(packPrice(getProduct("jockey-breech")!, 1)).toBe(59));
});
