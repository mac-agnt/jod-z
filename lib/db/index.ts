import { drizzle, type PostgresJsDatabase } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

export type DB = PostgresJsDatabase<typeof schema>;

// One pool per process, kept across dev hot reloads. Created on first use so
// builds and pages that never touch the database never connect.
const g = globalThis as unknown as { __jzDb?: { db: DB; sql: postgres.Sql } };

export function hasDatabase() {
  return !!process.env.DATABASE_URL;
}

export function db(): DB {
  if (g.__jzDb) return g.__jzDb.db;
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and point it at Postgres.");
  // prepare: false keeps it compatible with pgbouncer / Neon pooled URLs.
  const sql = postgres(url, { max: process.env.VERCEL ? 1 : 10, prepare: false, idle_timeout: 20 });
  const instance = drizzle(sql, { schema });
  g.__jzDb = { db: instance, sql };
  return instance;
}

export async function closeDb() {
  await g.__jzDb?.sql.end({ timeout: 5 });
  g.__jzDb = undefined;
}

export { schema };
