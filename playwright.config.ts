import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// E2E needs the same Supabase / app env the dev server uses.
loadEnv({ path: ".env.local" });

const BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  // Serial: these tests share one auth session + write to a live DB.
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [["list"]],
  globalTeardown: "./e2e/global-teardown.ts",
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },
  projects: [
    // Logs in once as the test agent and saves the session.
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/agent.json",
      },
      dependencies: ["setup"],
    },
  ],
  // Auto-starts the app if it isn't already running.
  webServer: {
    command: "npm run dev",
    url: BASE_URL,
    reuseExistingServer: true,
    timeout: 180_000,
  },
});
