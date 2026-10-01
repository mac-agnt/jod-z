// Trade portal demo data. Frontend only: replace with the Shopify B2B /
// wholesale API at launch. Every figure here is illustrative.

export const account = {
  firstName: "Siobhán",
  store: "The Saddle Room",
  town: "Kilkenny",
  tier: "Gold stockist",
  terms: "Net 30",
  rep: "Jody",
};

export const tradeRules = {
  caseSize: 6, // one size run per case
  vat: 0.23,
  freeFreightOver: 500,
  freight: 18,
};

/** Trade price per unit, ex VAT. RRP is the retail price. */
export type TradeItem = {
  id: string;
  product: string; // product slug
  colour: string; // colourway slug
  rrp: number;
  trade: number;
  sale?: number;
  sellThrough?: number; // % sold within 30 days, network-wide
  trend?: number; // % change vs last month
  stock: "In stock" | "Low stock" | "Pre-order";
};

export const catalogue: TradeItem[] = [
  { id: "leg-buttermilk", product: "the-jod-z", colour: "buttermilk-beige", rrp: 59, trade: 29.5, sellThrough: 92, trend: 18, stock: "In stock" },
  { id: "leg-black", product: "the-jod-z", colour: "midnight-black", rrp: 59, trade: 29.5, sellThrough: 88, trend: 6, stock: "In stock" },
  { id: "leg-navy", product: "the-jod-z", colour: "admiral-navy", rrp: 59, trade: 29.5, sellThrough: 81, trend: 11, stock: "Low stock" },
  { id: "leg-white", product: "the-jod-z", colour: "the-ultimate-white", rrp: 59, trade: 29.5, sellThrough: 74, trend: 24, stock: "In stock" },
  { id: "leg-pink", product: "the-jod-z", colour: "candy-floss-pink", rrp: 59, trade: 29.5, sellThrough: 69, trend: 9, stock: "In stock" },
  { id: "leg-stone", product: "the-jod-z", colour: "stone-grey", rrp: 59, trade: 29.5, sellThrough: 58, trend: -3, stock: "In stock" },
  { id: "leg-petrol", product: "the-jod-z", colour: "petrol-blue", rrp: 59, trade: 29.5, sale: 24, stock: "In stock" },
  { id: "leg-maroon", product: "the-jod-z", colour: "macaroon-maroon", rrp: 59, trade: 29.5, sale: 22, stock: "In stock" },
  { id: "leg-mazarine", product: "the-jod-z", colour: "mazarine-blue", rrp: 59, trade: 29.5, sale: 24, stock: "Low stock" },
  { id: "brc-black", product: "jockey-breech", colour: "eclipse-black", rrp: 59, trade: 29.5, sale: 21, stock: "In stock" },
  { id: "leg-berry", product: "the-jod-z", colour: "merry-berry", rrp: 59, trade: 29.5, stock: "In stock" },
  { id: "brc-navy", product: "jockey-breech", colour: "monarch-navy", rrp: 59, trade: 29.5, sellThrough: 63, trend: 14, stock: "Pre-order" },
];

export const item = (id: string) => catalogue.find((c) => c.id === id);

export type Order = {
  ref: string;
  date: string;
  status: "Delivered" | "In transit" | "Processing";
  lines: { id: string; cases: number }[];
};

export const orders: Order[] = [
  { ref: "JZ-T-10482", date: "18 Sept 2026", status: "In transit", lines: [{ id: "leg-buttermilk", cases: 3 }, { id: "leg-black", cases: 2 }, { id: "leg-navy", cases: 1 }] },
  { ref: "JZ-T-10311", date: "29 Aug 2026", status: "Delivered", lines: [{ id: "leg-buttermilk", cases: 2 }, { id: "leg-pink", cases: 1 }, { id: "brc-navy", cases: 1 }] },
  { ref: "JZ-T-10107", date: "2 Aug 2026", status: "Delivered", lines: [{ id: "leg-black", cases: 2 }, { id: "leg-white", cases: 2 }] },
];

/** Products this store has bought before, with last-ordered date. */
export const yourProducts: { id: string; last: string; soldAtYou: number }[] = [
  { id: "leg-buttermilk", last: "18 Sept", soldAtYou: 41 },
  { id: "leg-black", last: "18 Sept", soldAtYou: 33 },
  { id: "leg-navy", last: "18 Sept", soldAtYou: 17 },
  { id: "leg-pink", last: "29 Aug", soldAtYou: 12 },
  { id: "brc-navy", last: "29 Aug", soldAtYou: 5 },
  { id: "leg-white", last: "2 Aug", soldAtYou: 19 },
];
