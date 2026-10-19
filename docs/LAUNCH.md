# Jod-Z launch guide

Everything needed to take this build from local demo mode to the live shop.
Work top to bottom. Each integration is optional on its own: without its
keys that part of the site stays off (production) or shows demo data (local).

## 1. Facts to confirm with Jody first

These appear on the site or drive money. They are proposals or placeholders today.

| Item | Where it lives | Today |
|---|---|---|
| Pack prices (2 for €109, 3 for €149) | `lib/offer.ts` | Proposal. Shopify must charge the same: see §3.4 |
| Free delivery claim in the bag and buy-now flow | `lib/offer.ts` (`freeMessage`), `components/Cart.tsx` | Proposal. Must match Shopify shipping rates or be removed |
| Delivery times outside Ireland | `/delivery-returns` | Says "shown at checkout" |
| Who pays return postage | `/delivery-returns` | Says we send a label |
| Size chart in cm | `components/SizeGuide.tsx` | Age guide only (all the live site publishes) |
| Fabric composition, care label | `lib/products.ts` | Care copy from the old build |
| Full review text and permission | `lib/products.ts` (`reviews`) | Truncated quotes from the live site |
| Company legal name, CRO, VAT number, address | Vercel env `NEXT_PUBLIC_COMPANY_*` | Blank (footer and legal pages adapt) |
| Instagram and TikTok URLs | `NEXT_PUBLIC_INSTAGRAM_URL`, `NEXT_PUBLIC_TIKTOK_URL` | Generic links |
| Trade terms: discount, case size, freight, VAT | `lib/trade.ts`, per stockist in dashboard | 50% off RRP, 6 per case, free freight over €500, 23% VAT |
| VAT on children's sizes | `lib/trade.ts` | 23%. Ask the accountant: children's clothing can be zero-rated in Ireland |
| Ambassador discount and commission | Dashboard, per ambassador | 10% and 10% |
| Journal articles | `lib/journal.ts` | Short rewrites. Paste the full originals if wanted |
| Legal pages | `/privacy`, `/terms`, `/cookies` | Drafted for an Irish DTC brand. Have a solicitor read them |

Also fix on the old Shopify store before cutover: its Terms page lists
`infogalwayequestrian@gmail.com` for returns and says the shop is for adults
18+. The new pages use `hello@jod-z.com` and handle under-16s properly.

## 2. Hosting and database

1. Create a Vercel project from this repo. Framework: Next.js. Node 22.
2. Add a Postgres database (Vercel Marketplace, Neon). Copy the **pooled**
   connection string into `DATABASE_URL` for Production and Preview.
3. Set `AUTH_SECRET` (`openssl rand -base64 32`), `NEXT_PUBLIC_SITE_URL=https://jod-z.com`,
   `ADMIN_EMAILS` (Jody, you), `CRON_SECRET` (`openssl rand -hex 24`).
4. Deploys run `npm run vercel-build`, which applies database migrations, then builds.
5. Vercel Cron (from `vercel.json`) calls `/api/cron/sync` daily at 05:00 UTC.

## 3. Shopify

### 3.1 Storefront API (checkout and live stock)
Shopify admin → Sales channels → add **Headless**. Create a storefront and
copy the **public access token** into `SHOPIFY_STOREFRONT_TOKEN`. Give it
product listings, checkouts and **product inventory** access so stock counts
show. Set `SHOPIFY_STORE_DOMAIN=j10n8r-0b.myshopify.com`.

Without the token the site still sells: it falls back to Shopify cart links
(`COMMERCE_MODE=auto` picks this), using the public catalogue for stock.

### 3.2 Admin API (orders, stock, ambassador codes)
Settings → Apps and sales channels → Develop apps → create "Jod-Z website".
Admin API scopes: `read_orders`, `read_all_orders`, `read_products`,
`read_inventory`, `write_discounts`. Install, copy the token into
`SHOPIFY_ADMIN_TOKEN`. First sync backfills 180 days of orders.

### 3.3 Webhooks (orders in seconds, not daily)
Settings → Notifications → Webhooks: create JSON webhooks for
`Order creation` and `Order update` to `https://jod-z.com/api/webhooks/shopify`.
Copy the signing secret shown on that page into `SHOPIFY_WEBHOOK_SECRET`.

### 3.4 Pack pricing
The site sends a 2-pack as quantity 2 of one variant. Shopify must apply the
pack price. Simplest: a Shopify automatic discount per pack, or the Shopify
Bundles app. Test that a 2-pack and a 3-pack check out at €109 and €149.

Ambassador codes are created so they do not stack with other product
discounts (Shopify applies the better one). Decide with Jody whether a code
should stack with pack pricing; if yes, set `combinesWith.productDiscounts`
to true in `lib/shopify/admin.ts` and on the pack discount.

### 3.5 Domains
jod-z.com moves to Vercel. In Shopify, add `shop.jod-z.com` as the checkout
domain so checkout stays on your brand, then point jod-z.com DNS at Vercel.
Old Shopify URLs (`/products/*`, `/collections/*`, `/pages/*`, `/blogs/*`)
301 to the new pages automatically (`lib/redirects.ts`).

## 4. Meta

1. Business settings → Users → System users → create one with **ads_read**
   on the ad account. Generate a token into `META_ACCESS_TOKEN`.
2. `META_AD_ACCOUNT_ID` is the number after `act_` in Ads Manager.
3. `NEXT_PUBLIC_META_PIXEL_ID` for ViewContent, AddToCart and InitiateCheckout
   on this site (fires only after cookie consent).
4. Install Shopify's **Facebook & Instagram** app with data sharing set to
   Maximum. It sends Purchase events and the Conversions API from checkout.

## 5. Klaviyo

1. Create a private API key with read/write on Profiles, Lists, Subscriptions,
   and read on Campaigns, Flows, Metrics. Set `KLAVIYO_PRIVATE_KEY`.
2. `KLAVIYO_LIST_ID` is the main newsletter list. Turn on double opt-in for it.
3. Connect Klaviyo's Shopify integration so "Placed Order" exists.
4. Build these flows: Welcome series, Abandoned checkout, Browse abandonment,
   Post-purchase review ask, Back in stock.

Without Klaviyo, sign-ups are stored here and confirmed by our own email.

## 6. Email, spam protection, monitoring

- **Resend**: verify the jod-z.com domain, set `RESEND_API_KEY`,
  `EMAIL_FROM="Jod-Z <hello@jod-z.com>"`, `EMAIL_NOTIFY=hello@jod-z.com`.
  Sign-in links do not work in production without this.
- **Cloudflare Turnstile**: `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`.
- **Sentry**: `NEXT_PUBLIC_SENTRY_DSN`.
- **GA4** (optional): `NEXT_PUBLIC_GA4_ID`.

## 7. Before you switch DNS

- [ ] Dashboard → Settings shows every connection green; "Sync now" succeeds.
- [ ] Dashboard → Settings → Remove demo data.
- [ ] Place a real order with a real card, check it appears in Sales within a minute, then refund it.
- [ ] Approve a test ambassador: code appears in Shopify Discounts and works at checkout.
- [ ] Approve a test stockist, sign in as them, place a trade order.
- [ ] Sign up to the newsletter with a fresh email: confirmation email arrives.
- [ ] Check the cookie banner: Reject loads nothing; Accept loads GA4 and the Pixel.
- [ ] `npm run test:e2e` green; Lighthouse mobile on `/` and `/product/the-jod-z`.

## Local development

```bash
cp .env.example .env.local      # point DATABASE_URL at local Postgres
createdb jodz_dev && createdb jodz_test && createdb jodz_e2e
npm run db:migrate
npm run db:seed                 # demo data for the dashboard
npm run dev                     # http://localhost:3217
```

Sign in at `/sign-in` with an email from `ADMIN_EMAILS`: without Resend the
sign-in link appears on screen. Checks: `npm run check` (types, lint, unit
tests) and `npm run test:e2e`.

The repo folder name contains `(1)`, which confuses Turbopack's route
discovery, so scripts use webpack. On Vercel the path is clean either way.
