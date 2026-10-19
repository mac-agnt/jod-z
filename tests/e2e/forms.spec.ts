import { expect, test } from "@playwright/test";
import { quiet } from "./helpers";

test.beforeEach(async ({ page }) => quiet(page));

test("newsletter sign-up with double opt-in", async ({ page }) => {
  await page.goto("/contact");
  const news = page.getByRole("form", { name: "Newsletter sign-up" });
  await news.getByPlaceholder("Your email").fill(`e2e+${Date.now()}@example.com`);
  await news.getByRole("button", { name: "Join" }).click();
  // Native validation stops the submit until the age box is ticked.
  await expect(news.getByRole("checkbox")).toBeVisible();
  await news.getByRole("checkbox").check();
  await news.getByRole("button", { name: "Join" }).click();
  await expect(page.getByText("Check your inbox to confirm")).toBeVisible();
  await page.getByRole("link", { name: /open the confirmation link/ }).click();
  await page.getByRole("button", { name: "Confirm subscription" }).click();
  await expect(page.getByRole("heading", { name: "You are on the list." })).toBeVisible();
});

test("contact form validates and sends", async ({ page }) => {
  await page.goto("/contact");
  const form = page.locator(".contact-card form");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(form.getByText("Enter your name.")).toBeVisible();
  await form.getByLabel("Name").fill("Aoibheann Test");
  await form.getByLabel("Email").fill("aoibheann@example.com");
  await form.getByLabel("Topic").selectOption("Sizing help");
  await form.getByLabel("Message").fill("My daughter is 9 and tall for her age. XS or S?");
  await form.getByRole("button", { name: "Send message" }).click();
  await expect(page.getByText("Your message is with the team")).toBeVisible();
});

test("under-16 ambassador application waits for a guardian", async ({ page }) => {
  await page.goto("/affiliates");
  await page.getByRole("tab", { name: "Apply" }).click();
  const form = page.locator(".auth-panel form");
  await form.getByLabel("Full name").fill("Clodagh Test");
  await form.getByLabel("Email", { exact: true }).fill(`clodagh+${Date.now()}@example.com`);
  await form.getByLabel("Under 16").check();
  await form.getByLabel("Parent or guardian's name").fill("Gráinne Test");
  await form.getByLabel("Parent or guardian's email").fill(`grainne+${Date.now()}@example.com`);
  await form.getByRole("checkbox").check();
  await form.getByRole("button", { name: "Apply now" }).click();
  await expect(page.getByText(/emailed Gráinne Test/)).toBeVisible();
  await page.getByRole("link", { name: /guardian consent link/ }).click();
  await page.getByRole("button", { name: "I give permission" }).click();
  await expect(page.getByRole("heading", { name: "Thank you." })).toBeVisible();
});
