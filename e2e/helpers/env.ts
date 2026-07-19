// Shared E2E constants. Test-agent creds can be overridden via env vars.
export const AUTH_FILE = "e2e/.auth/agent.json";

export const E2E_AGENT_EMAIL =
  process.env.E2E_AGENT_EMAIL ?? "e2e-agent@anltest.local";
export const E2E_AGENT_PASSWORD =
  process.env.E2E_AGENT_PASSWORD ?? "E2eAgent!Pass123";

// Every property a test creates is prefixed with this so teardown can find and
// delete exactly the test data (and nothing real).
export const E2E_TITLE_PREFIX = process.env.E2E_TITLE_PREFIX ?? "[E2E]";
