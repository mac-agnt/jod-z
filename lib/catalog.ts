// Bridges this site's catalogue (one PDP per garment, colourways as
// variants) to the live Shopify store (one product per colour, sizes as
// variants). Safe for client and server.
import { getProduct, type Product } from "./products";
import { legPacks } from "./offer";

/** Shopify product handle for each colourway, from jod-z.com (Oct 2026). */
export const shopifyHandles: Record<string, Record<string, string>> = {
  "the-jod-z": {
    "midnight-black": "midnight-black-the-ultimate-equestrian-riding-legging",
    "admiral-navy": "admiral-navy-the-ultimate-equestrian-riding-legging",
    "mazarine-blue": "mazarine-blue-the-ultimate-equestrian-riding-legging",
    "petrol-blue": "petrol-blue-the-ultimate-equestrian-riding-legging",
    "stone-grey": "stone-grey-the-ultimate-equestrian-riding-legging",
    "macaroon-maroon": "macaroon-maroon-the-ultimate-equestrian-riding-legging",
    "merry-berry": "merry-berry",
    "candy-floss-pink": "candy-floss-the-ultimate-equestrian-riding-legging",
    "buttermilk-beige": "buttermilk-beige-the-ultimate-equestrian-riding-legging",
    "cotton-candy-white": "cotton-candy-white",
    "the-ultimate-white": "the-ultimate-white-the-ultimate-equestrian-riding-legging",
  },
  "jockey-breech": {
    "monarch-navy": "the-monarch-breech-navy",
    "eclipse-black": "the-eclipse-breech-black",
  },
};

/** Reverse lookup for webhooks: Shopify handle to product + colour. */
export function fromShopifyHandle(handle: string): { product: string; colour: string } | null {
  for (const [product, colours] of Object.entries(shopifyHandles)) {
    for (const [colour, h] of Object.entries(colours)) if (h === handle) return { product, colour };
  }
  return null;
}

/** Shopify writes 26” with curly quotes; this site writes 26". Compare without them. */
export const normSize = (s: string) => s.replace(/["”″'’]/g, "").trim().toUpperCase();

export const MAX_QTY = 20;

/** Allowed pack sizes for a product. Packs only exist for the legging. */
export const packSizes = (p: Product) => (p.kind === "legging" ? legPacks.map((x) => x.pairs) : [1]);

/** Price of one pack. The server always recomputes this; client prices are display only. */
export function packPrice(p: Product, pairs: number): number {
  if (p.kind === "legging") return legPacks.find((x) => x.pairs === pairs)?.price ?? p.price * pairs;
  return p.price * pairs;
}

export type LineInput = { product: string; colour: string; size: string; pairs: number; qty: number };

export type CheckedLine = LineInput & { title: string; unitPrice: number; total: number; units: number };

/** Validates a bag line against the catalogue. Returns null for anything tampered with. */
export function checkLine(l: LineInput): CheckedLine | null {
  const p = getProduct(l.product);
  const c = p?.colourways.find((x) => x.slug === l.colour);
  if (!p || !c || !p.sizes.includes(l.size)) return null;
  if (!packSizes(p).includes(l.pairs)) return null;
  if (!Number.isInteger(l.qty) || l.qty < 1 || l.qty > MAX_QTY) return null;
  const unitPrice = packPrice(p, l.pairs);
  return {
    ...l,
    title: `${p.name}, ${c.name}, ${l.size}${l.pairs > 1 ? `, ${l.pairs} pairs` : ""}`,
    unitPrice,
    total: unitPrice * l.qty,
    units: l.pairs * l.qty,
  };
}
