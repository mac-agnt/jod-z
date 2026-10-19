// Runs in every test worker before the tests import app code.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL ?? "postgres://localhost:5432/jodz_test";
process.env.ADMIN_EMAILS = "admin@jod-z.test";
process.env.AUTH_SECRET = "test-secret";
process.env.COMMERCE_MODE = "demo";
delete process.env.RESEND_API_KEY;
delete process.env.KLAVIYO_PRIVATE_KEY;
delete process.env.META_ACCESS_TOKEN;
delete process.env.SHOPIFY_STOREFRONT_TOKEN;
delete process.env.SHOPIFY_ADMIN_TOKEN;
