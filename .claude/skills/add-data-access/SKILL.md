---
name: add-data-access
description: Use when adding server-side data access for a table (reads or writes) — scaffolds the types → repository → service → guarded server action layers this repo uses, with the security rules baked in.
---

# Adding a data-access feature

This project uses a strict layered pattern. Follow it exactly.

## Layers (in order)

1. **Type** — `src/types/<name>.ts`. Define the domain shape returned to the UI.
   Never include PII in a "card"/"list" type that the browser can read for
   items the user doesn't own.

2. **Repository** — `src/lib/supabase/<name>.repository.ts`.
   - Import `createServiceRoleClient` from `@/lib/supabase/service-role`.
   - The service-role client **bypasses RLS**, so it is server-only. Never
     import a repository into a `"use client"` component.
   - Map raw rows to the domain type. Cast row fields via
     `(r.col as string | null) ?? null` (the codebase avoids `any`).
   - Enforce ownership **in the query** (`.eq("buyer_id", userId)`), not just
     in the UI.

3. **Service** (optional) — `src/lib/services/<name>.service.ts` for business
   logic (e.g. capacity/waitlist decisions). Thin pass-throughs are fine.

4. **Server action** — `src/lib/actions/<name>.action.ts` with `"use server"`.
   - Get the user: `const supabase = await createClient()` (from
     `@/lib/supabase/server`) → `supabase.auth.getUser()`.
   - Resolve role/ownership with
     `profileRepository.getSessionProfile(user.id)` (service-role).
   - **Re-check authorization on every action** — agent/owner/admin — and return
     `[]` / `{ success:false }` when unauthorized. Never trust the client.
   - Public/abuse-prone actions: rate-limit with `rateLimit()` from
     `@/lib/security/rate-limit` keyed by IP (`headers()` → `x-forwarded-for`),
     and cap input lengths.
   - Money/multi-step writes must be **atomic** — do them in a Postgres
     `SECURITY DEFINER` function (see `sql/2026-07-marketplace.sql`), not in JS.

## Database

- Add a migration in `sql/`. Enable RLS on new tables. Default to **no policies**
  (service-role only) unless the table is read publicly (then add a
  `for select using (...)` policy). Restrict sensitive RPCs with
  `revoke execute ... from public, anon, authenticated; grant ... to service_role;`.
- Tell the user to run the SQL in Supabase — do not attempt to write to their DB.

## Verify

Run `npx tsc --noEmit`, `npx eslint <files>`, and `npx next build` before finishing.
