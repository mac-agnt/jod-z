import { expect, test } from "@playwright/test";
import { quiet } from "./helpers";

const trackers = (page: import("@playwright/test").Page) => page.evaluate(() => [...document.scripts].map((s) => s.src).filter((s) => /googletagmanager|fbevents/.test(s)));

test("reject keeps trackers off; accept loads them", async ({ page }) => {
  await quiet(page, { consent: false });
  await page.goto("/");
  const banner = page.getByRole("dialog", { name: "Cookies on Jod-Z" });
  await expect(banner).toBeVisible();
  expect(await trackers(page)).toEqual([]);

  await banner.getByRole("button", { name: "Reject all" }).click();
  await expect(banner).toBeHidden();
  await page.reload();
  await expect(page.getByRole("dialog", { name: "Cookies on Jod-Z" })).toBeHidden();
  expect(await trackers(page)).toEqual([]);

  // Change of mind from the footer.
  await page.getByRole("button", { name: "Cookie settings" }).click();
  await page.getByRole("dialog", { name: "Cookies on Jod-Z" }).getByRole("button", { name: "Accept all" }).click();
  await expect.poll(() => trackers(page)).toHaveLength(2);
});
