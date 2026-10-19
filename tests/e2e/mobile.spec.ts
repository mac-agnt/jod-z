import { expect, test } from "@playwright/test";
import { quiet } from "./helpers";

test.beforeEach(async ({ page }) => quiet(page));

for (const path of ["/", "/product/the-jod-z", "/sizing", "/contact", "/delivery-returns", "/retailers", "/journal"]) {
  test(`no sideways scroll on ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForLoadState("networkidle");
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
}

test("menu opens and navigates on a phone", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: "Menu" }).click();
  await page.locator(".menu.open").getByRole("link", { name: "Sizing" }).click();
  await expect(page).toHaveURL(/\/sizing$/);
});

test("images on key pages have alt text", async ({ page }) => {
  for (const path of ["/", "/product/the-jod-z"]) {
    await page.goto(path);
    const missing = await page.locator("img:not([alt])").count();
    expect(missing, path).toBe(0);
  }
});
