import { expect, test } from "@playwright/test";
import { quiet, signIn } from "./helpers";

test.beforeEach(async ({ page }) => quiet(page));

test("dashboard is locked without a session", async ({ page }) => {
  await page.goto("/admin/sales");
  await expect(page).toHaveURL(/\/sign-in\?next=%2Fadmin%2Fsales/);
});

test("unknown emails get the same answer and no link", async ({ page }) => {
  await page.goto("/sign-in");
  await page.getByPlaceholder(/@/).fill("nobody@example.com");
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  await expect(page.getByText("If that email has an account")).toBeVisible();
  await expect(page.getByRole("link", { name: /Development only/ })).toHaveCount(0);
});

test("admin signs in and every dashboard page renders", async ({ page }) => {
  await signIn(page, "/sign-in?next=/admin", "admin@jod-z.test");
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { level: 1, name: "Overview" })).toBeVisible();
  await expect(page.getByText("Demo data.")).toBeVisible();
  for (const [path, title] of [["/admin/sales", "Sales"], ["/admin/ads", "Meta ads"], ["/admin/email", "Email list"], ["/admin/traffic", "Traffic"], ["/admin/inventory", "Stock"], ["/admin/ambassadors", "Ambassadors"], ["/admin/retailers", "Stockists"], ["/admin/messages", "Messages"], ["/admin/settings", "Settings"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1, name: title })).toBeVisible();
  }
  // Charts have a table view.
  await page.goto("/admin/sales");
  await page.getByRole("button", { name: "Table" }).first().click();
  await expect(page.getByRole("columnheader", { name: "Revenue" }).first()).toBeVisible();
});

test("admin approves an ambassador and the code appears", async ({ page }) => {
  await signIn(page, "/sign-in?next=/admin/ambassadors", "admin@jod-z.test");
  const row = page.getByRole("row", { name: /Orla Hayes/ });
  await row.getByRole("button", { name: "Approve" }).click();
  await expect(page.getByRole("row", { name: /Orla Hayes/ }).getByText("ORLA10")).toBeVisible();
});

test("a stockist signs in, orders and cannot reach the dashboard", async ({ page }) => {
  await signIn(page, "/retailers", "thesaddleroom@example.com");
  await expect(page).toHaveURL(/\/retailers\/portal/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Welcome back");
  await page.getByRole("button", { name: /Add case/ }).first().click();
  await page.getByRole("button", { name: /Place order/ }).click();
  await expect(page.getByText("Order placed.")).toBeVisible();
  await page.goto("/admin");
  await expect(page).toHaveURL(/denied=1/);
});
