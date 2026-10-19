// Trade (wholesale) rules. Confirm every value with Jody before launch:
// these drive the prices stockists see and pay.

export const tradeRules = {
  caseSize: 6, // pairs per case, one size run
  vat: 0.23, // check with the accountant: children's clothing can be zero-rated in Ireland
  freeFreightOver: 500, // ex VAT
  freight: 18,
  minCases: 1,
};

/** End-of-season trade prices per unit, ex VAT, keyed "product:colour". Empty = no sale section. */
export const tradeSale: Record<string, number> = {};

/** Trade price per pair, ex VAT. RRP is the retail price. */
export type TradeItem = {
  id: string; // "product:colour"
  product: string;
  colour: string;
  name: string;
  colourName: string;
  image?: string;
  hex: string;
  kind: "legging" | "breech";
  rrp: number;
  trade: number;
  sale?: number;
  stock: "In stock" | "Low stock" | "Out of stock";
};

export type TradeOrder = {
  id: string;
  ref: string;
  date: string;
  status: "submitted" | "confirmed" | "shipped" | "delivered" | "cancelled";
  total: number;
  lines: { id: string; cases: number }[];
};

export const unitPrice = (t: Pick<TradeItem, "trade" | "sale">) => t.sale ?? t.trade;
export const casePrice = (t: Pick<TradeItem, "trade" | "sale">) => unitPrice(t) * tradeRules.caseSize;

/** Basket maths shared by the portal UI and the server action that places the order. */
export function basketTotals(lines: { item: Pick<TradeItem, "trade" | "sale" | "rrp">; cases: number }[]) {
  const sub = lines.reduce((n, l) => n + casePrice(l.item) * l.cases, 0);
  const units = lines.reduce((n, l) => n + l.cases * tradeRules.caseSize, 0);
  const freight = sub === 0 || sub >= tradeRules.freeFreightOver ? 0 : tradeRules.freight;
  const vat = Math.round((sub + freight) * tradeRules.vat * 100) / 100;
  const margin = lines.reduce((n, l) => n + (l.item.rrp - unitPrice(l.item)) * l.cases * tradeRules.caseSize, 0);
  return { sub, units, freight, vat, total: Math.round((sub + freight + vat) * 100) / 100, margin, toFree: Math.max(0, tradeRules.freeFreightOver - sub) };
}
