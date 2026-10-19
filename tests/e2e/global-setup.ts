// Fresh schema plus demo data in the e2e database before every run.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import * as schema from "../../lib/db/schema";
import { seedDemo } from "../../lib/demo/seed";
import { E2E_DB } from "../../playwright.config";

export default async function setup() {
  const sql = postgres(E2E_DB, { max: 1, onnotice: () => {} });
  await sql.unsafe("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  const db = drizzle(sql, { schema });
  await migrate(db, { migrationsFolder: "drizzle" });
  await seedDemo(db, 60);
  await sql.end();
}
