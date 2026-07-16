# Security hardening

This document tracks the app's security posture. Items marked ✅ are implemented
in code; ☐ items are configuration you apply in Supabase / your host.

## Implemented in the app ✅

- **Security headers + CSP** — set for every response in `next.config.ts`:
  `Content-Security-Policy`, `Strict-Transport-Security` (HSTS, 2y + preload),
  `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, a restrictive
  `Permissions-Policy`, and `X-DNS-Prefetch-Control: off`. `X-Powered-By` is
  disabled (`poweredByHeader: false`).
- **Route authorization** — `src/proxy.ts` guards `/admin*`, `/agent*`,
  `/owner*`, `/profile*`; roles resolved server-side via the service role.
- **Server actions are authorization-checked** — admin actions
  (`lead-admin.action.ts`, `admin-properties.action.ts`) verify `role = admin`
  before doing anything.
- **Service-role key is server-only** — imported solely by repositories /
  actions / scripts, never by a client component. Verified.
- **Secrets** — `.env*` is git-ignored; `.env.local` is untracked.
- **Public lead form** — validated + length-capped + **rate-limited**
  (5 / 10 min per IP) in `src/app/actions/lead.actions.ts`.
- **next/image** — remote images locked to an allowlist (`res.cloudinary.com`).

## Apply in Supabase ☐

1. **Enable Row Level Security** on every table — run
   `sql/2026-07-rls-hardening.sql`. Key outcomes:
   - `profiles`: users read/update only their own row; a trigger blocks
     self-promotion of `role` / `account_type`.
   - `properties`: public read, writes only via the service role.
   - `leads`: fully locked (all access is service-role).
   - **Events** — run `sql/2026-07-events.sql`: `events` are publicly readable
     only when `status = 'published'`; `event_registrations` are fully locked
     (RSVP happens through the rate-limited server action / service role).
2. **Auth settings**:
   - Require email confirmation; enable **leaked-password protection**.
   - Set the **Redirect URL allowlist** (site URL + `/reset-password`,
     `/auth`, `/admin`).
   - Configure **custom SMTP** (built-in email is rate-limited, not for prod).
   - Consider **MFA** for admin accounts.
3. **Keys**: never expose `SUPABASE_SERVICE_ROLE_KEY` to the browser; if it was
   ever committed or shared, **rotate** it. Keep it only in server env.

## Apply at the host / ops ☐

- Serve over **HTTPS** so HSTS takes effect; enable HTTP→HTTPS redirect.
- Run `npm audit` in CI. Current: 2 moderate advisories via Next's bundled
  PostCSS (build-time only) — wait for a Next patch rather than force-downgrade.
- Keep dependencies patched; enable automated security updates.

## Recommended follow-ups (not yet done)

- **Nonce-based CSP** to drop `'unsafe-inline'` from `script-src` (strongest
  XSS mitigation). Requires per-request nonce injection via the proxy.
- **Shared-store rate limiting** (e.g. Upstash Redis) — the current limiter is
  in-memory / per-instance, best-effort behind multiple instances.
- Rename `src/lib/supabase/admin.ts` (`supabaseAdmin`) — it actually uses the
  **anon** key; the name invites misuse. Point it at a clearly-named anon
  client or the service role explicitly.
