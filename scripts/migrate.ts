// Applies SQL migrations in /drizzle. Run on deploy (vercel-build) and after
// pulling schema changes. Skips quietly when no database is configured so
// preview builds without a database still succeed.
import { loadEnvConfig } from "@next/env";
import { migrate } from "drizzle-orm/postgres-js/migrator";

loadEnvConfig(process.cwd());

async function main() {
  if (!process.env.DATABASE_URL) {
    console.log("migrate: DATABASE_URL not set, skipping");
    return;
  }
  const { db, closeDb } = await import("../lib/db");
  await migrate(db(), { migrationsFolder: "drizzle" });
  await closeDb();
  console.log("migrate: up to date");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
