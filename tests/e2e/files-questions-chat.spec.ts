import path from "node:path";
import { test, expect } from "@playwright/test";

/**
 * Covers the interface flows not exercised by golden-path.spec.ts: upload
 * study material, generate practice questions grounded in it, answer one,
 * and open the subject-scoped assistant chat and get a cited response —
 * all in demo/heuristic mode (no AI provider configured).
 */
test.describe("files, practice questions and assistant chat", () => {
  test("upload material, practice a topic, and chat with the assistant about it", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: /continuar en modo demo/i }).click();
    await page.waitForURL(/\/(onboarding|hoy)/);
    if (page.url().includes("/onboarding")) {
      await page.getByLabel(/como te llamas/i).fill("Santiago");
      await page.getByRole("button", { name: /comenzar/i }).click();
      await page.waitForURL(/\/hoy/);
    }

    // 1. Create a subject to attach material to.
    await page.goto("/estudios");
    await page.getByRole("button", { name: /nueva materia/i }).click();
    const subjectName = `Fisica E2E ${Date.now()}`;
    await page.getByLabel(/^nombre$/i).fill(subjectName);
    await page.getByRole("button", { name: /crear materia/i }).click();
    await expect(page.getByText(subjectName)).toBeVisible();

    // 2. Upload material for that subject.
    await page.goto("/archivos");
    await page.getByLabel(/archivo \(pdf/i).setInputFiles(
      path.join(__dirname, "fixtures", "sample-material.txt"),
    );
    await page.getByLabel(/materia \(opcional\)/i).click();
    await page.getByRole("option", { name: subjectName }).click();
    await page.getByRole("button", { name: /^subir$/i }).click();
    await expect(page.getByText(/archivo subido/i).first()).toBeVisible({ timeout: 15_000 });
    const fileRow = page.locator("main li").filter({ hasText: "sample-material.txt" });
    await expect(fileRow).toBeVisible({ timeout: 15_000 });
    await expect(fileRow.getByText(/^listo$/i)).toBeVisible({ timeout: 15_000 });

    // 3. Create a topic on the subject and generate practice questions from it.
    await page.goto("/estudios");
    await page.getByRole("link", { name: new RegExp(subjectName) }).click();
    await page.getByRole("tab", { name: /^temas$/i }).click();
    await page.getByRole("button", { name: /nuevo tema/i }).click();
    await page.getByLabel(/^nombre$/i).fill("Tiro oblicuo");
    await page.getByRole("button", { name: /crear tema/i }).click();
    await expect(page.getByText("Tiro oblicuo", { exact: true })).toBeVisible();

    await page.getByRole("button", { name: /practicar este tema/i }).click();
    await expect(page.getByText(/pregunta 1 de/i)).toBeVisible({ timeout: 15_000 });

    // Answer whatever question type came up.
    const verdaderoButton = page.getByRole("button", { name: "Verdadero" });
    if (await verdaderoButton.isVisible().catch(() => false)) {
      await verdaderoButton.click();
    } else {
      await page.getByPlaceholder(/escribi tu respuesta/i).fill("El alcance maximo es con 45 grados.");
      await page.getByRole("button", { name: /^corregir$/i }).click();
    }
    await expect(page.getByText(/correcto/i).first()).toBeVisible({ timeout: 15_000 });

    // 4. Ask the assistant about the uploaded material, scoped to the subject.
    await page.goto("/asistente");
    await page.getByLabel(/contexto/i).click();
    await page.getByRole("option", { name: new RegExp(`Materia: ${subjectName}`) }).click();
    await page.getByLabel(/^mensaje$/i).fill("¿Con que angulo se logra el alcance maximo en un tiro oblicuo?");
    await page.getByRole("button", { name: /enviar mensaje/i }).click();
    await expect(page.getByText("sample-material.txt", { exact: true })).toBeVisible({ timeout: 15_000 });
  });
});
