import { defineConfig, devices } from "@playwright/test";

// End-to-end suite against its own dev server and database (jodz_e2e),
// seeded with demo data, in demo commerce mode so checkout runs locally.
const PORT = 3218;
export const E2E_DB = process.env.E2E_DATABASE_URL ?? "postgres://localhost:5432/jodz_e2e";

export default defineConfig({
  testDir: "tests/e2e",
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  globalSetup: "./tests/e2e/global-setup.ts",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] }, testIgnore: /mobile\.spec/ },
    { name: "mobile", use: { ...devices["Pixel 7"] }, testMatch: /mobile\.spec/ },
  ],
  webServer: {
    command: `npx next dev --webpack -p ${PORT}`,
    url: `http://localhost:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_DIST_DIR: ".next-e2e",
      DATABASE_URL: E2E_DB,
      NEXT_PUBLIC_SITE_URL: `http://localhost:${PORT}`,
      AUTH_SECRET: "e2e-secret",
      ADMIN_EMAILS: "admin@jod-z.test",
      COMMERCE_MODE: "demo",
      RESEND_API_KEY: "",
      KLAVIYO_PRIVATE_KEY: "",
      TURNSTILE_SECRET_KEY: "",
      NEXT_PUBLIC_TURNSTILE_SITE_KEY: "",
      // Fake IDs so the cookie banner and consent gating are exercised. Tests block the real scripts.
      NEXT_PUBLIC_GA4_ID: "G-E2ETEST",
      NEXT_PUBLIC_META_PIXEL_ID: "000000000000000",
    },
  },
});
