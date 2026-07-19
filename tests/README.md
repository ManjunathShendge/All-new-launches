# Property form test suite

Rigorous, deterministic tests for the **property creation pipeline** —
`form input → validated → DB row → detail view model`. This is where every
"I entered X and it didn't show / saved wrong" bug lived, so the suite targets
that pipeline directly (no browser, no live DB, no flakiness).

## Run

```bash
npm test           # run once
npm run test:watch # watch mode
```

## What's covered (50 tests)

**`property-create.logic.test.ts`** — the create logic (`src/lib/actions/property-create.logic.ts`):
- Validation: short/blank titles, missing city/locality, boundary (exactly 5 chars).
- Numeric coercion (`numOr0`/`numOrNull`), `code`/`slugify`.
- Row building for **every category & purpose**: residential sale, rent/lease/PG,
  project (price/area **ranges**), land/shop (`extra_attributes` jsonb).
- Edge & adversarial input: non-numeric → 0/null, **XSS** & **SQL-injection**
  strings stored verbatim (parameterized, never executed), unicode/emoji,
  very large numbers, inverted min/max is **not** silently swapped, possession
  code mapping.
- Media builders: distinct `attachment_id` (no unique-constraint collision),
  first image primary, `image_type` only on gallery, empty lists → no rows.

**`property-display.test.ts`** — the full round-trip into the detail view model
(`mapPropertyDetail`):
- Amenities picked in the form surface as `amenityLabels`.
- Residential shows configurations; **commercial office shows none** (no "N/A").
- Carpet/super area, floors, facing, furnishing, ownership, video, virtual tour,
  landmarks, bed/bath all map through.
- `parseAmenities` JSON / comma / dedupe / empty handling.

## Design notes

- `src/lib/actions/property-create.logic.ts` holds the **pure** logic; the
  `createProperty` server action just wires it to Supabase. Tests exercise the
  same code the action runs (no drift).
- `factory.ts` builds a complete valid `CreatePropertyInput`; override per test.

## Next step: browser E2E (optional)

For true click-through coverage of the multi-step wizard, add Playwright:
drive the real form against `npm run dev` with a dedicated test-agent account
and tagged/auto-cleaned data. The pure suite above already locks down the data
pipeline (the actual bug class); Playwright would add UI-interaction coverage.
