import { cleanupE2EProperties } from "./helpers/db";

// Safety net: even if a spec fails mid-way, remove any [E2E]-tagged properties.
export default async function globalTeardown() {
  try {
    const n = await cleanupE2EProperties();
    if (n > 0) console.log(`[e2e teardown] removed ${n} test property(ies)`);
  } catch (e) {
    console.warn("[e2e teardown] cleanup skipped:", (e as Error).message);
  }
}
