import { test as setup, expect } from "@playwright/test";
import { ensureTestAgent } from "./helpers/db";
import { AUTH_FILE, E2E_AGENT_EMAIL, E2E_AGENT_PASSWORD } from "./helpers/env";

// Runs once before the suite: guarantees a verified agent account exists, logs
// in through the real UI, and persists the session for the other tests.
setup("authenticate as test agent", async ({ page }) => {
  await ensureTestAgent();

  await page.goto("/auth");
  await page.locator('input[name="email"]').fill(E2E_AGENT_EMAIL);
  await page.locator('input[name="password"]').fill(E2E_AGENT_PASSWORD);
  // The page also has a footer newsletter (Subscribe) submit and a "Log In"
  // toggle button — target the login submit specifically (both conditions).
  await page
    .getByRole("button", { name: "Log In" })
    .and(page.locator('button[type="submit"]'))
    .click();

  // Agents land on the home page after login (only admins go straight to a
  // dashboard). Wait for that redirect so the session cookie is established...
  await page.waitForURL((url) => url.pathname === "/", { timeout: 30_000 });
  // ...then confirm the session works by opening the agent dashboard.
  await page.goto("/agent/dashboard");
  await expect(
    page.getByRole("button", { name: "Add New Property" })
  ).toBeVisible({ timeout: 15_000 });

  await page.context().storageState({ path: AUTH_FILE });
});
