// Demo data so the dashboard can be built, tested and shown before real
// integrations are connected. Every row is flagged is_demo and can be
// removed in one go from Settings. Never runs in production.
import { eq } from "drizzle-orm";
import type { DB } from "../db";
import * as schema from "../db/schema";
import { products } from "../products";
import { legPacks } from "../offer";
import { tradeRules } from "../trade";

// Small seeded RNG so every reseed tells the same story.
function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

type Weighted<T> = [T, number][];

export async function clearDemo(db: DB) {
  await db.delete(schema.orders).where(eq(schema.orders.isDemo, true));
  await db.delete(schema.adInsights).where(eq(schema.adInsights.isDemo, true));
  await db.delete(schema.emailCampaigns).where(eq(schema.emailCampaigns.isDemo, true));
  await db.delete(schema.listSnapshots).where(eq(schema.listSnapshots.isDemo, true));
  await db.delete(schema.analyticsEvents).where(eq(schema.analyticsEvents.isDemo, true));
  await db.delete(schema.subscribers).where(eq(schema.subscribers.isDemo, true));
  await db.delete(schema.ambassadors).where(eq(schema.ambassadors.isDemo, true));
  await db.delete(schema.retailers).where(eq(schema.retailers.isDemo, true));
  await db.delete(schema.contactMessages).where(eq(schema.contactMessages.isDemo, true));
  await db.delete(schema.inventory).where(eq(schema.inventory.provider, "demo"));
}

async function insertChunks<T>(rows: T[], size: number, insert: (chunk: T[]) => Promise<unknown>) {
  for (let i = 0; i < rows.length; i += size) await insert(rows.slice(i, i + size));
}

export async function seedDemo(db: DB, days = 180) {
  const r = rng(20261019);
  const pick = <T,>(w: Weighted<T>): T => {
    const total = w.reduce((n, [, x]) => n + x, 0);
    let x = r() * total;
    for (const [v, k] of w) { x -= k; if (x <= 0) return v; }
    return w[w.length - 1][0];
  };
  const between = (a: number, b: number) => a + r() * (b - a);
  const hex = (n = 16) => Array.from({ length: n }, () => Math.floor(r() * 16).toString(16)).join("");
  const dayStart = (d: number) => { const x = new Date(); x.setUTCHours(0, 0, 0, 0); x.setUTCDate(x.getUTCDate() - d); return x; };
  const iso = (d: Date) => d.toISOString().slice(0, 10);

  await clearDemo(db);

  const legging = products.find((p) => p.kind === "legging")!;
  const breech = products.find((p) => p.kind === "breech")!;
  const colourW: Weighted<string> = [["buttermilk-beige", 18], ["midnight-black", 16], ["admiral-navy", 14], ["the-ultimate-white", 9], ["candy-floss-pink", 7], ["stone-grey", 7], ["merry-berry", 6], ["petrol-blue", 5], ["macaroon-maroon", 5], ["mazarine-blue", 5], ["cotton-candy-white", 4]];
  const sizeW: Weighted<string> = [["2XS", 8], ["XS", 18], ["S", 28], ["M", 28], ["L", 18]];
  const packW: Weighted<number> = [[1, 62], [2, 26], [3, 12]];
  const countryW: Weighted<string> = [["IE", 72], ["GB", 18], ["DE", 3], ["FR", 3], ["NL", 2], ["ES", 2]];
  type Src = [string | null, string | null];
  const sourceW: Weighted<Src> = [[["facebook", "paid_social"], 38], [["instagram", "social"], 18], [["google", "organic"], 14], [[null, null], 18], [["klaviyo", "email"], 8], [["tiktok", "social"], 4]];

  // Ambassadors
  const amb = [
    ["Rosie Doyle", "ROSIE10", "@rosie.rides"], ["Aoife Brennan", "AOIFE10", "@aoifeandpip"], ["Ciara Moran", "CIARA10", "@ciara_eventing"], ["Grace Nolan", "GRACE10", "@gracenolan.equestrian"],
    ["Sophie Daly", "SOPHIE10", "@sophiesponyclub"], ["Kate Gallagher", "KATE10", "@kate.showjumps"], ["Lucy Power", "LUCY10", "@lucypower_"], ["Méabh Quinn", "MEABH10", "@meabhandmilo"],
  ] as const;
  await db.insert(schema.ambassadors).values([
    ...amb.map(([name, code, handle], i) => ({ name, email: `${code.toLowerCase()}@example.com`, handle, code, status: "approved" as const, under16: i % 3 === 0, guardianName: i % 3 === 0 ? "Parent on file" : null, guardianConsentAt: i % 3 === 0 ? dayStart(150 - i * 10) : null, source: i % 2 ? "popup" : "partner-page", isDemo: true, createdAt: dayStart(170 - i * 12), decidedAt: dayStart(165 - i * 12) })),
    { name: "Orla Hayes", email: "orla@example.com", handle: "@orlahayes", status: "applied", source: "popup", isDemo: true, createdAt: dayStart(3) },
    { name: "Freya Lynch", email: "freya@example.com", handle: "@freya.and.bramble", status: "applied", source: "partner-page", isDemo: true, createdAt: dayStart(1) },
    { name: "Hannah Tierney", email: "hannah@example.com", status: "applied", source: "popup", isDemo: true, createdAt: dayStart(6) },
    { name: "Isla Doherty", email: "isla@example.com", handle: "@isladoherty", under16: true, guardianName: "Maeve Doherty", guardianEmail: "maeve@example.com", status: "awaiting_guardian", source: "popup", isDemo: true, createdAt: dayStart(2) },
    { name: "Zoe Fennell", email: "zoe@example.com", status: "rejected", source: "popup", isDemo: true, createdAt: dayStart(40), decidedAt: dayStart(38) },
    { name: "Molly Keane", email: "molly@example.com", handle: "@mollykeane", code: "MOLLY10", status: "paused", source: "partner-page", isDemo: true, createdAt: dayStart(120), decidedAt: dayStart(118) },
  ]);
  const codeW: Weighted<string> = amb.map(([, code], i) => [code, 10 - i]);

  // Retailers
  const shops = [
    ["The Saddle Room", "Siobhán Ryan", "Kilkenny", "Saddlery or tack shop", "approved", "Gold stockist", "Net 30"],
    ["Bridle Lane Saddlery", "Conor Walsh", "Naas", "Saddlery or tack shop", "approved", "Stockist", "Net 30"],
    ["Hazelwood Equestrian", "Deirdre Costello", "Galway", "Equestrian centre or yard shop", "approved", "Stockist", "Prepay"],
    ["Paddock and Pony", "Ruth McAllister", "Belfast", "Boutique", "approved", "Stockist", "Prepay"],
    ["Kestrel Tack and Feed", "Brian O'Shea", "Mallow", "Saddlery or tack shop", "applied", "Stockist", "Prepay"],
    ["Riverbank Riding Shop", "Jane Corr", "Wexford", "Equestrian centre or yard shop", "rejected", "Stockist", "Prepay"],
  ] as const;
  const retailerRows = await db.insert(schema.retailers).values(shops.map(([storeName, contactName, town, storeType, status, tier, paymentTerms], i) => ({
    storeName, contactName, town, storeType, status, tier, paymentTerms, email: `${storeName.toLowerCase().replace(/[^a-z]+/g, "")}@example.com`,
    country: town === "Belfast" ? "Northern Ireland" : "Ireland", isDemo: true, createdAt: dayStart(175 - i * 25), decidedAt: status === "applied" ? null : dayStart(170 - i * 25),
  }))).returning({ id: schema.retailers.id, status: schema.retailers.status, terms: schema.retailers.paymentTerms });

  // Web orders
  type OrderRow = typeof schema.orders.$inferInsert;
  type LineRow = Omit<typeof schema.orderLines.$inferInsert, "orderId">;
  const orders: { o: OrderRow; lines: LineRow[] }[] = [];
  const dailyOrders: number[] = [];
  const metaRevenue: number[] = [];
  const customers: string[] = [];
  let n = 1000;
  for (let d = days - 1; d >= 0; d--) {
    const date = dayStart(d);
    const dow = date.getUTCDay();
    const growth = 1 + (days - d) / days * 0.6;
    const launch = d < 40 && d > 25 ? 1.5 : 1; // autumn colours launch
    const weekend = dow === 0 || dow === 6 ? 1.3 : 1;
    const count = Math.max(0, Math.round(between(3, 7) * growth * launch * weekend));
    dailyOrders[d] = count;
    metaRevenue[d] = 0;
    for (let i = 0; i < count; i++) {
      const lineCount = pick<number>([[1, 80], [2, 17], [3, 3]]);
      const lines: LineRow[] = [];
      for (let k = 0; k < lineCount; k++) {
        const isBreech = r() < 0.08;
        if (isBreech) {
          const colour = pick<string>([["monarch-navy", 6], ["eclipse-black", 4]]);
          const size = pick<string>([['26"', 2], ['28"', 4], ['30"', 3], ['32"', 1]]);
          lines.push({ product: breech.slug, colour, size, title: `${breech.name}, ${breech.colourways.find((c) => c.slug === colour)!.name}, ${size}`, quantity: 1, unitPrice: breech.price, total: breech.price });
        } else {
          const colour = pick(colourW), size = pick(sizeW), pairs = pick(packW);
          const price = legPacks.find((p) => p.pairs === pairs)!.price;
          lines.push({ product: legging.slug, colour, size, title: `${legging.name}, ${legging.colourways.find((c) => c.slug === colour)!.name}, ${size}${pairs > 1 ? `, ${pairs} pairs` : ""}`, quantity: pairs, unitPrice: Math.round((price / pairs) * 100) / 100, total: price });
        }
      }
      const subtotal = lines.reduce((s, l) => s + (l.total ?? 0), 0);
      const [utmSource, utmMedium] = pick(sourceW);
      const code = r() < 0.09 ? pick(codeW) : undefined;
      const discount = code ? Math.round(subtotal * 0.1 * 100) / 100 : 0;
      const shipping = subtotal >= 50 ? 0 : 4.95;
      const total = Math.round((subtotal - discount + shipping) * 100) / 100;
      const roll = r();
      const status = roll < 0.03 ? "refunded" : roll < 0.05 ? "partially_refunded" : "paid";
      const returning = customers.length > 20 && r() < 0.28;
      const customer = returning ? customers[Math.floor(r() * customers.length)] : hex(24);
      if (!returning) customers.push(customer);
      const placedAt = new Date(date.getTime() + between(7, 23) * 3_600_000);
      if (utmSource === "facebook") metaRevenue[d] += total;
      orders.push({
        o: {
          channel: "web", provider: "shopify", externalId: `demo-${hex(12)}`, number: `#${++n}`, customerHash: customer, country: pick(countryW),
          subtotal, discountTotal: discount, shippingTotal: shipping, total, refundedTotal: status === "refunded" ? total : status === "partially_refunded" ? Math.round(total * 0.5 * 100) / 100 : 0,
          discountCodes: code ? [code] : [], status, utmSource, utmMedium, utmCampaign: utmSource === "facebook" ? pick<string>([["prospecting-broad", 6], ["retargeting-30d", 3], ["autumn-colours", d < 40 ? 6 : 0]]) : null,
          isFirstOrder: !returning, isDemo: true, placedAt, updatedAt: placedAt,
        },
        lines,
      });
    }
  }

  // Wholesale orders
  const approved = retailerRows.filter((x) => x.status === "approved");
  const wsStatus = ["delivered", "delivered", "delivered", "shipped", "confirmed", "submitted"] as const;
  approved.forEach((shop, si) => {
    const count = 4 - Math.min(si, 2);
    for (let i = 0; i < count; i++) {
      const d = Math.floor(160 - i * (150 / count) - si * 7);
      const lines: LineRow[] = [];
      const colours = [...new Set(Array.from({ length: 3 }, () => pick(colourW)))];
      for (const colour of colours) {
        const cases = 1 + Math.floor(r() * 3);
        const units = cases * tradeRules.caseSize;
        const unitPrice = legging.price * 0.5;
        lines.push({ product: legging.slug, colour, size: "Size run", title: `${legging.name}, ${legging.colourways.find((c) => c.slug === colour)!.name}, ${cases} case${cases > 1 ? "s" : ""}`, quantity: units, unitPrice, total: unitPrice * units });
      }
      const subtotal = lines.reduce((s, l) => s + (l.total ?? 0), 0);
      const shipping = subtotal >= tradeRules.freeFreightOver ? 0 : tradeRules.freight;
      const tax = Math.round((subtotal + shipping) * tradeRules.vat * 100) / 100;
      const placedAt = dayStart(Math.max(1, d));
      orders.push({
        o: { channel: "wholesale", provider: "portal", number: `JZ-T-${10100 + si * 10 + i}`, retailerId: shop.id, country: "IE", subtotal, shippingTotal: shipping, taxTotal: tax, total: subtotal + shipping + tax, status: "paid",
          wholesaleStatus: i === count - 1 ? wsStatus[5 - si] ?? "confirmed" : "delivered", paymentTerms: shop.terms, isDemo: true, placedAt, updatedAt: placedAt },
        lines,
      });
    }
  });

  for (const chunk of Array.from({ length: Math.ceil(orders.length / 200) }, (_, i) => orders.slice(i * 200, i * 200 + 200))) {
    const ids = await db.insert(schema.orders).values(chunk.map((x) => x.o)).returning({ id: schema.orders.id });
    await db.insert(schema.orderLines).values(chunk.flatMap((x, i) => x.lines.map((l) => ({ ...l, orderId: ids[i].id }))));
  }

  // Ads: four campaigns, ad-level rows roll up to campaign rows.
  const campaigns = [
    { id: "demo-c1", name: "Prospecting | Leggings | Broad", share: 0.5, ads: [["demo-a1", "Show day reel"], ["demo-a2", "Buttermilk Beige carousel"], ["demo-a3", "Pack of 3 offer"]] },
    { id: "demo-c2", name: "Retargeting | Site visitors 30d", share: 0.2, ads: [["demo-a4", "Free delivery reminder"], ["demo-a5", "Reviews carousel"]] },
    { id: "demo-c3", name: "Pony Club | Interest", share: 0.15, ads: [["demo-a6", "Mirror selfie UGC"], ["demo-a7", "Yard day video"]] },
    { id: "demo-c4", name: "Autumn colours launch", share: 0.3, ads: [["demo-a8", "Macaroon Maroon hero"], ["demo-a9", "Merry Berry reel"]] },
  ];
  type Ins = typeof schema.adInsights.$inferInsert;
  const ins: Ins[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const date = iso(dayStart(d));
    const live = campaigns.filter((c) => c.id !== "demo-c4" || d < 40);
    const totalShare = live.reduce((s, c) => s + c.share, 0);
    const budget = between(45, 70) * (1 + (days - d) / days * 0.5) * (d < 40 && d > 25 ? 1.6 : 1);
    const reported = metaRevenue[d] * between(1.05, 1.35); // Meta's own attribution overcounts
    for (const c of live) {
      const w = c.share / totalShare;
      const spend = budget * w;
      const value = reported * w * (c.id === "demo-c2" ? 1.8 : c.id === "demo-c3" ? 0.6 : 1);
      const impressions = Math.round(spend / between(7, 11) * 1000);
      const clicks = Math.round(impressions * between(0.009, 0.016));
      const purchases = Math.round(value / 88);
      ins.push({ date, level: "campaign", entityId: c.id, entityName: c.name, campaignId: c.id, campaignName: c.name, spend: Math.round(spend * 100) / 100, impressions, clicks, purchases, purchaseValue: Math.round(value * 100) / 100, isDemo: true });
      c.ads.forEach(([id, name], k) => {
        const aw = (c.ads.length - k) / ((c.ads.length * (c.ads.length + 1)) / 2);
        ins.push({ date, level: "ad", entityId: id, entityName: name, campaignId: c.id, campaignName: c.name, thumbnailUrl: null, spend: Math.round(spend * aw * 100) / 100, impressions: Math.round(impressions * aw), clicks: Math.round(clicks * aw), purchases: Math.round(purchases * aw), purchaseValue: Math.round(value * aw * 100) / 100, isDemo: true });
      });
    }
  }
  await insertChunks(ins, 500, (c) => db.insert(schema.adInsights).values(c));

  // Email
  let list = 1460;
  const snaps: (typeof schema.listSnapshots.$inferInsert)[] = [];
  for (let d = days - 1; d >= 0; d--) {
    list += Math.round(between(2, 10) * (d < 40 && d > 25 ? 2.2 : 1)) - (r() < 0.3 ? 1 : 0);
    snaps.push({ date: iso(dayStart(d)), listSize: list, isDemo: true });
  }
  await insertChunks(snaps, 500, (c) => db.insert(schema.listSnapshots).values(c));
  const camps = ["Meet the Jod-Z Legging", "Spring yard edit", "Pony Club camp checklist", "Three pairs, one price", "New: Jockey Breeches", "Summer show season", "Back to school, back to the yard", "Autumn colours are here", "Macaroon Maroon is back", "Your size is back in stock"];
  await db.insert(schema.emailCampaigns).values([
    ...camps.map((name, i) => {
      const d = Math.round(days - 10 - i * ((days - 14) / camps.length));
      const recipients = snaps[days - 1 - d]?.listSize ?? 1500;
      const opens = Math.round(recipients * between(0.36, 0.52));
      const clicks = Math.round(recipients * between(0.015, 0.04));
      const conversions = Math.round(recipients * between(0.002, 0.006));
      return { id: `demo-camp-${i}`, name, subject: name, sentAt: new Date(dayStart(d).getTime() + 10 * 3_600_000), recipients, opens, clicks, conversions, revenue: Math.round(conversions * between(78, 96)), kind: "campaign" as const, isDemo: true };
    }),
    ...[["Welcome series", 0.9], ["Abandoned checkout", 1.4], ["Browse abandonment", 0.5], ["Post-purchase review ask", 0.2], ["Back in stock", 0.6]].map(([name, k], i) => {
      const recipients = Math.round(between(600, 2400) * (k as number));
      const conversions = Math.round(recipients * between(0.01, 0.05) * (k as number));
      return { id: `demo-flow-${i}`, name: name as string, recipients, opens: Math.round(recipients * between(0.45, 0.62)), clicks: Math.round(recipients * between(0.04, 0.09)), conversions, revenue: Math.round(conversions * between(80, 95)), kind: "flow" as const, isDemo: true };
    }),
  ]);
  const subs: (typeof schema.subscribers.$inferInsert)[] = [];
  for (let d = days - 1; d >= 0; d--) {
    const k = Math.round(between(2, 8) * (d < 40 && d > 25 ? 2 : 1));
    for (let i = 0; i < k; i++) {
      const roll = r();
      subs.push({ email: `demo+${hex(10)}@example.com`, source: pick<string>([["footer", 45], ["popup", 35], ["restock", 10], ["contact", 10]]), status: roll < 0.85 ? "subscribed" : roll < 0.95 ? "pending" : "unsubscribed", ageConfirmed: true, consentText: "Demo", consentAt: new Date(dayStart(d).getTime() + between(8, 22) * 3_600_000), isDemo: true, createdAt: new Date(dayStart(d).getTime() + between(8, 22) * 3_600_000) });
    }
  }
  await insertChunks(subs, 500, (c) => db.insert(schema.subscribers).values(c));

  // Traffic: cookieless daily visitors, each with a short path through the funnel.
  const ev: (typeof schema.analyticsEvents.$inferInsert)[] = [];
  const pages: Weighted<string> = [["/", 40], ["/product/the-jod-z", 30], ["/product/jockey-breech", 6], ["/sizing", 10], ["/affiliates", 5], ["/contact", 3], ["/delivery-returns", 6]];
  for (let d = days - 1; d >= 0; d--) {
    const base = dayStart(d).getTime();
    const visitors = Math.round(((dailyOrders[d] ?? 4) / between(0.019, 0.027)));
    for (let v = 0; v < visitors; v++) {
      const id = hex(32);
      const [utmSource, utmMedium] = pick(sourceW);
      const device = pick<string>([["mobile", 74], ["desktop", 22], ["tablet", 4]]);
      const country = pick(countryW);
      const t = base + between(6, 23.5) * 3_600_000;
      const common = { visitorId: id, utmSource, utmMedium, device, country, isDemo: true };
      const views = 1 + Math.floor(r() * 3);
      for (let p = 0; p < views; p++) ev.push({ ...common, name: "page_view", path: pick(pages), ts: new Date(t + p * 40_000) });
      if (r() < 0.56) {
        const colour = pick(colourW);
        ev.push({ ...common, name: "view_item", path: "/product/the-jod-z", product: legging.slug, colour, value: legging.price, ts: new Date(t + 60_000) });
        if (r() < 0.17) {
          ev.push({ ...common, name: "add_to_cart", path: "/product/the-jod-z", product: legging.slug, colour, value: pick<number>([[59, 6], [109, 3], [149, 1]]), ts: new Date(t + 120_000) });
          if (r() < 0.55) ev.push({ ...common, name: "begin_checkout", path: "/product/the-jod-z", value: 90, ts: new Date(t + 180_000) });
        }
      }
    }
  }
  await insertChunks(ev, 2000, (c) => db.insert(schema.analyticsEvents).values(c));

  // Stock
  const inv: (typeof schema.inventory.$inferInsert)[] = [];
  for (const p of products) for (const c of p.colourways) for (const s of p.sizes) {
    const roll = r();
    inv.push({ product: p.slug, colour: c.slug, size: s, available: roll < 0.05 ? 0 : roll < 0.14 ? 1 + Math.floor(r() * 3) : Math.round(between(8, 60)), provider: "demo" });
  }
  await db.insert(schema.inventory).values(inv).onConflictDoNothing();

  await db.insert(schema.contactMessages).values([
    { name: "Gillian Kerr", email: "gillian@example.com", topic: "Sizing help", message: "My daughter is 11, 148cm and slim. Is S right or should we go XS?", status: "new", isDemo: true, createdAt: dayStart(0) },
    { name: "Mark Hennessy", email: "mark@example.com", topic: "Order or delivery", orderNumber: "#1612", message: "Tracking hasn't updated in two days. Can you check it for me?", status: "new", isDemo: true, createdAt: dayStart(1) },
    { name: "Tara Duggan", email: "tara@example.com", topic: "Returns and exchanges", orderNumber: "#1588", message: "The M is a little long. Could I swap it for an S in the same colour?", status: "replied", isDemo: true, createdAt: dayStart(4) },
    { name: "Eimear Lyons", email: "eimear@example.com", topic: "Wholesale", message: "We run a riding school shop in Clare and would love to stock a few colours.", status: "replied", isDemo: true, createdAt: dayStart(9) },
    { name: "Paula Byrne", email: "paula@example.com", topic: "Something else", message: "Do you do gift cards? Christmas is coming.", status: "closed", isDemo: true, createdAt: dayStart(15) },
  ]);

  return { orders: orders.length, events: ev.length, adRows: ins.length, subscribers: subs.length };
}
