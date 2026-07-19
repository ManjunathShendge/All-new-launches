# Browser E2E (Playwright)

Real-browser tests that drive the actual **Add Property** flow — login →
dashboard → wizard → multi-step form → submit — and verify what lands in the DB.

## Run

```bash
npm run test:e2e          # headless
npm run test:e2e:headed   # watch it in a browser
npm run test:e2e:ui       # Playwright UI mode (time-travel debugging)
```

The config auto-starts `npm run dev` if the app isn't already running
(`reuseExistingServer`). Browsers are already installed; if not:
`npx playwright install chromium`.

## What it covers

`property-form.spec.ts` (residential sale, single unit):
1. Wizard leads into the multi-step form.
2. Per-step validation blocks progress (short title, missing property type).
3. **Full create → DB verify**: fills every required step, submits, asserts the
   success screen, then reads the row back and checks status=`pending`,
   transaction/category/price/city/locality.

> This suite caught a real regression the first time it ran — a `"use server"`
> file re-exporting a type broke `createProperty` for every agent. That's the
> point of the browser layer: it exercises the real Next server-action runtime.

## How it works

- **`auth.setup.ts`** — a setup project that ensures a verified test agent
  exists (via the Supabase admin API, no email click), logs in through the real
  UI, and saves the session to `e2e/.auth/agent.json` (gitignored). All other
  tests reuse that session.
- **`helpers/db.ts`** — service-role client for agent setup, DB verification,
  and cleanup.
- **`pages/PropertyFormPage.ts`** — Page Object. Handles the custom `<Select>`
  (portal listbox; it closes on page scroll, so the field is scrolled into view
  *before* opening) and the label-derived `data-testid`s on each `Field`.

## Safety

- Every created listing is titled with the `[E2E]` prefix.
- `global-teardown.ts` deletes all `[E2E]` properties (and their media) after
  the run — even on failure. Verified: nothing is left behind.
- **No payments** are involved in the property flow.
- The test agent (`e2e-agent@anltest.local`) is created once and reused; override
  with `E2E_AGENT_EMAIL` / `E2E_AGENT_PASSWORD` if you want a different account.

## Test hooks added to the app

`PropertyForm` fields carry auto `data-testid="field-<label-slug>"` (e.g.
`field-property-type`); nav buttons are `form-next` / `form-prev` /
`form-submit`; the error banner is `form-error`; the success screen is
`property-submitted`. These are inert in production.
