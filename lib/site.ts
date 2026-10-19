// Public site facts shared by client and server code. Company details are
// what Jody must confirm before launch: they appear in the footer, legal
// pages and structured data.

export const siteUrl = () => (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3217").replace(/\/$/, "");

export const company = {
  name: "Jod-Z",
  legalName: process.env.NEXT_PUBLIC_COMPANY_LEGAL_NAME ?? "Jod-Z",
  croNumber: process.env.NEXT_PUBLIC_COMPANY_CRO ?? "",
  vatNumber: process.env.NEXT_PUBLIC_COMPANY_VAT ?? "",
  address: process.env.NEXT_PUBLIC_COMPANY_ADDRESS ?? "Ireland",
  email: "hello@jod-z.com",
  instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "https://www.instagram.com/",
  tiktok: process.env.NEXT_PUBLIC_TIKTOK_URL ?? "https://www.tiktok.com/",
};

/** From the live store's refund policy (jod-z.com/pages/privacy-and-refund-policy). */
export const returnsWindowDays = 30;
