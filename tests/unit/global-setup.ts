// Fresh schema in the test database before the unit suite runs.
import postgres from "postgres";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export const TEST_DB = process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/jodz_test";

export default async function setup() {
  const sql = postgres(TEST_DB, { max: 1, onnotice: () => {} });
  await sql.unsafe("drop schema if exists public cascade; drop schema if exists drizzle cascade; create schema public;");
  await migrate(drizzle(sql), { migrationsFolder: "drizzle" });
  await sql.end();
}
