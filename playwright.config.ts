import { existsSync } from "node:fs";
import { defineConfig, devices } from "@playwright/test";

// This sandbox environment pre-installs a Chromium revision older than the
// one this pinned @playwright/test version would try to download. Point at
// it ONLY when it's actually present (this dev sandbox); everywhere else
// (CI, a contributor's machine) fall back to Playwright's normal managed
// browser, installed via `pnpm exec playwright install chromium`.
const SANDBOX_CHROMIUM_PATH = "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";
const sandboxChromiumExecutable = existsSync(SANDBOX_CHROMIUM_PATH) ? SANDBOX_CHROMIUM_PATH : undefined;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["html", { open: "never" }]],
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? "http://localhost:3000",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        launchOptions: sandboxChromiumExecutable
          ? { executablePath: sandboxChromiumExecutable }
          : {},
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm start",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: {
      NEXT_PUBLIC_DATA_MODE: "demo",
    },
  },
});
