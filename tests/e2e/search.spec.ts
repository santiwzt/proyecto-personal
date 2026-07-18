import { test, expect } from "@playwright/test";

test.describe("global search", () => {
  test("searching from the topbar finds a seeded subject", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /continuar en modo demo/i }).click();
    await page.waitForURL(/\/(onboarding|hoy)/);
    if (page.url().includes("/onboarding")) {
      await page.getByLabel(/como te llamas/i).fill("Santiago");
      await page.getByRole("button", { name: /comenzar/i }).click();
      await page.waitForURL(/\/hoy/);
    }

    await page.getByLabel(/^buscar$/i).fill("Fisica");
    await page.getByLabel(/^buscar$/i).press("Enter");
    await page.waitForURL(/\/buscar\?q=Fisica/);
    await expect(page.getByRole("heading", { name: /buscar/i })).toBeVisible();
    await expect(page.locator("main").getByText("Fisica", { exact: true })).toBeVisible();
  });

  test("shows an empty state for a query with no matches", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /continuar en modo demo/i }).click();
    await page.waitForURL(/\/(onboarding|hoy)/);
    if (page.url().includes("/onboarding")) {
      await page.getByLabel(/como te llamas/i).fill("Santiago");
      await page.getByRole("button", { name: /comenzar/i }).click();
      await page.waitForURL(/\/hoy/);
    }

    await page.getByLabel(/^buscar$/i).fill("zzzznomatchzzzz");
    await page.getByLabel(/^buscar$/i).press("Enter");
    await page.waitForURL(/\/buscar\?q=/);
    await expect(page.getByText(/sin resultados/i)).toBeVisible();
  });
});
