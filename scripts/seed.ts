// npm run db:seed  (refuses to run against production)
import { loadEnvConfig } from "@next/env";

loadEnvConfig(process.cwd());

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production") throw new Error("Refusing to seed demo data in production.");
  const { db, closeDb } = await import("../lib/db");
  const { seedDemo } = await import("../lib/demo/seed");
  const t = Date.now();
  const r = await seedDemo(db());
  await closeDb();
  console.log(`seeded ${r.orders} orders, ${r.events} events, ${r.adRows} ad rows, ${r.subscribers} subscribers in ${((Date.now() - t) / 1000).toFixed(1)}s`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
