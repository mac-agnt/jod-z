import { expect, type Page } from "@playwright/test";

/** Skips the intro animation, the ambassador pop-up and the cookie banner (as "reject"), and never loads third-party trackers. */
export async function quiet(page: Page, { consent = true }: { consent?: boolean } = {}) {
  await page.route(/googletagmanager\.com|connect\.facebook\.net|google-analytics\.com/, (r) => r.abort());
  if (consent) {
    await page.context().addCookies([{ name: "jz_consent", value: encodeURIComponent(JSON.stringify({ analytics: false, marketing: false, at: Date.now(), v: 1 })), url: "http://localhost:3218" }]);
  }
  await page.addInitScript(() => {
    try {
      sessionStorage.setItem("jz-loaded", "1");
      localStorage.setItem("jz-amb-closed", String(Date.now()));
    } catch {}
  });
}

/** Signs in through the emailed link (shown on screen in development). */
export async function signIn(page: Page, path: string, email: string) {
  await page.goto(path);
  await page.getByPlaceholder(/@/).first().fill(email);
  await page.getByRole("button", { name: "Email me a sign-in link" }).click();
  const link = page.getByRole("link", { name: /Development only/ });
  await expect(link).toBeVisible();
  await link.click();
  await page.getByRole("button", { name: "Continue" }).click();
}
