# Jod-Z: Premium Site Direction

## 1. Creative direction

**One idea: the legging as an icon.** Jod-Z currently reads as a fun, loud yard brand ("No faff", "Attitude sold separate"). The new site keeps that confidence but delivers it quietly: fewer words, larger images, one product treated like a watch face.

- **Luxury editorial (LV):** full-bleed campaign imagery, oversized serif, very little copy, generous space.
- **Precision (Rolex):** the product shot on a seamless studio sweep, identical framing across every colourway, detail macros of the knee grip and waistband.
- **Conversion (ál'in):** one PDP, big swatches, colour name updates live, sticky add-to-bag, calm accordions.

Palette: ink `#141416`, navy `#151c2e`, cream `#f3efe7`, paper `#faf8f4`, muted gold `#a8905e` (used under 10%: hero italic, stars, focus rings).
Type: Cormorant Garamond (display, italic for voice) + Manrope (UI, labels, body). Swap for licensed faces if Jody has brand fonts.
Motion: fade + 24px rise on scroll, 0.6s crossfade on swatch change, underline-draw on links. Everything disabled under `prefers-reduced-motion`.

## 2. Site structure

```
/                         Home (Hero, Riders, Shop)
/product/the-jod-z        PDP, ?colour=<slug> deep-links a colourway
(later) /size-guide, /delivery-returns, /our-story, /cart (Shopify checkout)
```
Tracksuits (Coin Grey, Hunter Green) sit outside the hero product. Recommend a second PDP later, same template, not on the homepage.

## 3. Homepage sections

| # | Section | Job | Content |
|---|---|---|---|
| 1 | Hero | Premium in one glance | Full-bleed campaign still, eyebrow "Designed and tested by riders", H1 "Made for the yard.", 12-word sub, "Shop the legging" + "See colours" |
| 2 | Riders (UGC) | Proof | 6 curated tiles in an asymmetric grid (1 tall, 4 square, 1 full-width), 3 short reviews with stars |
| 3 | Shop | The product is the star | Large studio render left, name + live colour name + note, 9 swatches, price, one CTA deep-linking to the PDP in that colour; colourway ticker below |

## 4. PDP structure

1. Gallery: hero front shot + side, back, in-the-saddle, knee-grip macro (mobile: swipe carousel)
2. Sticky buy column: crumb, title, descriptor, price, colour swatches (radiogroup, arrow-key nav), sizes 2XS to L, inline error if no size, Add to bag
3. Reassurance line: returns, Klarna / wallets
4. Accordions: Fit (open by default), Materials and features, Care, Delivery and returns
5. Detail band: waistband-in-hand, folded flat-lay
6. Selected reviews (curated, all colours pooled)
7. Sticky bottom bar appears after the main CTA scrolls away
Cross-sell: none for now. Add the tracksuit only when it has matching photography.

## 5. Asset request list for Jody

**Brand:** logo (SVG, light + dark), any guidelines, fonts, founder / brand story, existing straplines (confirm keep: "Made for the yard", "No see-through drama", "Built properly").
**Product:** confirm full colourway list and which are live, exact colour values or fabric swatches, price in EUR and GBP, size chart in cm by age, fit notes, fabric composition and GSM, care label, shipping rates and times, returns window, stock per colour/size.
**Visual:** every existing photo (cutouts, model, lifestyle, UGC), fabric close-ups, packaging.
**Proof:** full review export with permission, parent quotes, rider Instagram handles with consent to repost, any stockists or riders of note.

**Missing now (placeholders in build):** all photography, logo SVG, size chart, material composition, shipping/returns policy, full review text (live-site quotes are truncated), social handle.

## 6. Shot list

| Category | Shots | Direction |
|---|---|---|
| Hero campaign | 2 landscape 16:9 + 1 portrait 4:5 for mobile | Rider at a stable door or walking out at dawn; low backlight, 35mm, full length, deep shadow on the left for type. Navy or black legging. Muted, filmic, no heavy grading. |
| Product renders | Per colour: front, side, back, seated, walking | Same model, same mark, seamless warm-grey sweep, soft top light, 4:5. Identical crop every colour so swatch swaps feel like one image changing. |
| Colourway set | 9 flat or ghost-mannequin shots, 3:4 | Collectible. Centred, same shadow, used in the ticker. |
| UGC | 15 to 20 curated | Real riders, phone-real but well composed: tacking up, arena, fence line at golden hour, tack-room mirror. Avoid clutter, logos of other brands. |
| Detail | 6 to 8 macros | Silicone grip under raking light, waistband being pulled on, seam, pocket with phone, folded stack with gloves and crop. |

## 7. Copy direction

Short, declarative, confident. Parent-trust meets rider pride. No horse puns, no "unleash", no exclamation marks, no em-dashes.
- Hero: "Made for the yard." / "One legging, built properly. Silicone grip, no see-through, nine colours."
- Riders: "Worn by riders who never take them off."
- Shop: "One legging. Nine colours."
- Colour notes: one line each, practical ("Show-ring white. Fully opaque.")

## 8. Components

`Header` (transparent over hero, solid after) · `Footer` · `Shot` (art-directed image slot, swap for `next/image`) · `Reveal` (IntersectionObserver fade) · `Swatches` (accessible radiogroup) · `ShopSection` (stage + ticker) · `Stars` · `PDP` (gallery, buy column, accordions, sticky CTA, toast). Data in `lib/product.ts`.

## 9. Build plan

1. **Now (done):** Next.js 14 + TS strict, hand-written CSS tokens, home + PDP, placeholder art direction, keyboard and reduced-motion support.
2. **Assets:** receive from Jody, shoot per section 6, drop into `/public`, replace `Shot` internals with `next/image` (priority on hero).
3. **Commerce:** connect Shopify Storefront API (one product, variants = colour x size), real cart drawer, checkout redirect, stock-aware sizes ("Low stock", sold-out states).
4. **Reviews:** pull from Judge.me / Okendo but render in this template, curated subset only.
5. **Polish + launch:** analytics events (swatch_change, size_select, add_to_cart), Lighthouse pass, 301s from old per-colour URLs to `?colour=` on the single PDP to keep SEO.

## v2 update

- **Routes:** `/`, `/product/the-jod-z`, `/product/pullover-tracksuit`, `/sizing`, `/affiliates`, `/retailers`.
- **Homepage:** hero (image slot + product card + feature rail), rider video roll (9:16 reels, infinite, pauses on hover), collection (legging + tracksuit, live swatches), selected reviews.
- **Loader:** handwritten "Jod-Z" draws in stroke, fills, gold rule, panel slides up. Once per session, skipped for reduced motion.
- **Adding media:** set paths in `lib/media.ts` (hero, reels) and `image` on any colourway in `lib/products.ts`.
- **Still placeholder:** size chart values, portal form submission (needs CRM / Shopify B2B endpoint), portal sign-in links, checkout.
- **Not yet added:** Eclipse and Monarch breeches (€59, 26" to 32") exist on the live store. Same PDP template if wanted.
