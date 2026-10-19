/** Stock per colourway and size for one product. Missing entries mean "available". */
export type Availability = Record<string, Record<string, { available: boolean; quantity?: number }>>;

/** First-touch marketing source, carried into the order. */
export type Attribution = {
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  landing?: string;
  referrer?: string;
  /** Ambassador code the visitor arrived with (?ref=CODE). */
  code?: string;
};

export type CheckoutResult = { ok: true; url: string } | { ok: false; error: string };

/** Low-stock line under the size buttons. */
export const LOW_STOCK = 3;
