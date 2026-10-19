import { expect, test } from "@playwright/test";
import { quiet } from "./helpers";

test.beforeEach(async ({ page }) => quiet(page));

test("home page loads with the product and no console errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Made for");
  await expect(page.getByRole("link", { name: "Shop leggings" }).first()).toBeVisible();
  expect(errors.filter((e) => !/favicon|Download the React DevTools/.test(e))).toEqual([]);
});

test("buy a 2-pack through demo checkout", async ({ page }) => {
  await page.goto("/product/the-jod-z?colour=admiral-navy");
  await expect(page.getByRole("heading", { level: 1, name: /Jod-Z Legging/ })).toBeVisible();

  // Adding without a size asks for one.
  await page.getByRole("button", { name: /Add to bag/ }).click();
  await expect(page.locator("#size-group [role=alert]")).toContainText("Choose a size");

  await page.getByRole("radio", { name: "2 pairs" }).click();
  const size = page.locator("#size-group").getByRole("radio").filter({ hasNotText: "2XS" }).and(page.locator(":not([aria-disabled])")).first();
  await size.click();
  await page.getByRole("button", { name: /Add to bag, €109/ }).click();

  const bag = page.getByRole("dialog", { name: "Your bag" });
  await expect(bag).toContainText("2 pairs");
  await bag.getByRole("button", { name: "Checkout securely" }).click();

  await expect(page).toHaveURL(/\/checkout\/demo\//);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("placed");
  await expect(page.getByText("€109").first()).toBeVisible();
});

test("an ambassador link applies the code at checkout", async ({ page }) => {
  await page.goto("/?ref=rosie10");
  await page.goto("/product/the-jod-z?colour=midnight-black");
  await page.locator("#size-group").getByRole("radio", { name: /^S$/ }).click();
  await page.getByRole("button", { name: /Add to bag/ }).click();
  await expect(page.getByRole("dialog", { name: "Your bag" })).toContainText("Code ROSIE10 is applied at checkout");
});

test("old Shopify URLs redirect to the new pages", async ({ page }) => {
  await page.goto("/products/merry-berry");
  await expect(page).toHaveURL(/\/product\/the-jod-z\?colour=merry-berry/);
  await page.goto("/pages/size-guide");
  await expect(page).toHaveURL(/\/sizing$/);
});

test("help and policy pages render", async ({ page }) => {
  for (const [path, heading] of [["/delivery-returns", "Delivery and"], ["/faq", "Questions"], ["/privacy", "Privacy"], ["/terms", "Terms of"], ["/cookies", "Cookie"], ["/journal", "journal"]]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(heading);
  }
  const res = await page.goto("/definitely-not-a-page");
  expect(res?.status()).toBe(404);
});
