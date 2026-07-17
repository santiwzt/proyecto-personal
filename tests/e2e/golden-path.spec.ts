import { test, expect } from "@playwright/test";

/**
 * Golden path: sign in (demo mode) -> onboarding -> create a subject -> create
 * an exam -> create a task -> see the dashboard reflect it -> generate a
 * weekly plan -> approve a block. Exercises the app the way a first-time
 * user actually would, end to end, against the real demo data store.
 */
test.describe("golden path", () => {
  test("demo login through planner approval", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: /nexo personal os/i })).toBeVisible();
    await page.getByRole("button", { name: /continuar en modo demo/i }).click();

    // Either onboarding (first run) or straight to /hoy if already completed
    // in a previous run against the same (in-memory) server process.
    await page.waitForURL(/\/(onboarding|hoy)/);
    if (page.url().includes("/onboarding")) {
      await page.getByLabel(/como te llamas/i).fill("Santiago");
      await page.getByRole("button", { name: /comenzar/i }).click();
      await page.waitForURL(/\/hoy/);
    }

    await expect(page.getByRole("heading", { name: /^hola,/i })).toBeVisible();

    // Create a subject.
    await page.goto("/estudios");
    await page.getByRole("button", { name: /nueva materia/i }).click();
    const subjectName = `Materia E2E ${Date.now()}`;
    await page.getByLabel(/^nombre$/i).fill(subjectName);
    await page.getByRole("button", { name: /crear materia/i }).click();
    await expect(page.getByText(subjectName)).toBeVisible();

    await page.getByText(subjectName).click();
    await expect(page.getByRole("heading", { name: subjectName })).toBeVisible();

    // Create an exam for that subject.
    await page.getByRole("tab", { name: /examenes/i }).click();
    await page.getByRole("button", { name: /nuevo examen/i }).click();
    await page.getByLabel(/titulo/i).fill("Examen E2E");
    const examDate = new Date();
    examDate.setDate(examDate.getDate() + 5);
    const isoLocal = examDate.toISOString().slice(0, 16);
    await page.getByLabel(/fecha y hora/i).fill(isoLocal);
    await page.getByRole("button", { name: /crear examen/i }).click();
    await expect(page.getByText("Examen E2E")).toBeVisible();

    // Create a task via the agenda page.
    await page.goto("/agenda");
    await page.getByRole("button", { name: /nueva tarea/i }).click();
    const taskTitle = `Tarea E2E ${Date.now()}`;
    await page.getByLabel(/titulo/i).fill(taskTitle);
    await page.getByRole("button", { name: /^guardar$/i }).click();
    await expect(page.getByText(taskTitle)).toBeVisible();

    // Dashboard reflects the new task.
    await page.goto("/hoy");
    await expect(page.getByText(taskTitle)).toBeVisible();

    // Generate a weekly plan and approve everything.
    await page.goto("/agenda");
    await page.getByRole("button", { name: /generar plan/i }).click();
    await expect(page.getByText(/propuse|no hay suficiente|no encontre/i)).toBeVisible({ timeout: 15_000 });

    const approveAllButton = page.getByRole("button", { name: /aprobar todo/i });
    if (await approveAllButton.isVisible().catch(() => false)) {
      await approveAllButton.click();
      await expect(page.getByText(/ya estan en tu agenda/i).first()).toBeVisible();
    }
  });
});
