# Jod-Z

Storefront, dashboard and partner portals for Jod-Z riding leggings.
Next.js 16 (App Router), React 19, Postgres (Drizzle), Shopify for checkout.

- **Shop**: home, product pages with live stock, bag, Shopify checkout (Storefront API or cart links), journal, help and legal pages.
- **Dashboard** (`/admin`): sales, Meta ads, email list, traffic and funnel, stock, ambassadors, stockists, messages, settings.
- **Trade portal** (`/retailers/portal`): stockists order by the case at their trade price.
- **Partner portal** (`/affiliates/portal`): ambassadors see their code, orders and commission.
- **Sign-in**: passwordless email links, roles admin / retailer / ambassador.
- **Data in**: Shopify webhooks and daily sync, Meta Marketing API, Klaviyo, and cookieless first-party analytics.
- **Privacy**: cookie consent before GA4 or the Meta Pixel, under-16 guardian consent, GDPR erase tool.

Setup and go-live steps: [docs/LAUNCH.md](docs/LAUNCH.md). Design direction: [STRATEGY.md](STRATEGY.md).

```bash
npm run dev         # http://localhost:3217
npm run check       # typecheck, lint, unit tests
npm run test:e2e    # Playwright, desktop and mobile
npm run db:seed     # demo data (never in production)
```
