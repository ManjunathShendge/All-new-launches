# Advanced features — backlog

Features intentionally deferred. Each needs either extra infra (email/WhatsApp/
payments/scheduled jobs) or is non-essential polish. The core flows work without
them.

Status legend: ☐ not started · ◐ partial.

## Events

### Registration / notifications
- ☐ **Confirmation email** after RSVP (needs an email provider — Resend /
  SendGrid / Supabase SMTP).
- ☐ **WhatsApp confirmation** after RSVP (needs a WhatsApp Business API /
  provider such as Twilio or Gupshup).
- ☐ **Waitlist "spot opened" notification** — when a confirmed registrant
  cancels and capacity frees up, email/WhatsApp the next waitlisted person and
  promote them. (Data is ready: `event_registrations.status` +
  `notified` flag already exist.)
- ☐ **Add to Calendar** — Google / Outlook links + downloadable `.ics` file on
  the event detail page.

### Discovery / detail
- ☐ **Similar events** section on the detail page (by shared category /
  locality — simple SQL filter).
- ☐ **Social share** — WhatsApp share + copy-link buttons on cards and detail.

### Admin polish
- ☐ **Draft autosave** while creating/editing an event (localStorage or
  debounced server save) so a long form survives a refresh/crash.
- ☐ **Duplicate event** — clone an existing event's fields into a new draft.
- ☐ **Bulk actions** — select multiple events → publish / cancel / delete.
- ☐ **Banner crop / preview** on upload (card vs detail aspect ratios).
- ◐ **Capacity progress bar in admin list** — count is shown; a visual bar
  could be added.

## Leads Marketplace

### Discovery & browsing
- ☐ Saved filter presets (named, one-click reapply) — needs a `saved_filters`
  table.
- ☐ Sort options (newest / price / locality).
- ☐ Lead card hover/tap preview (posted time, inquiry type) without unblurring.
- ☐ Infinite scroll / pagination with count.
- ☐ "New" badge for leads posted in the last 24h.

### Purchase flow (needs a PAYMENT PROVIDER — Razorpay / Stripe)
- ☐ Pre-purchase confirmation modal.
- ☐ Bulk-buy cart UX (persistent cart drawer + running total).
- ☐ Wallet balance in header + low-balance nudge — needs `wallet` /
  `transactions` tables.
- ☐ One-click reorder / "buy 5 more like this".
- ☐ Purchase success state — animated unlock/reveal of contact info.
- ☐ Receipt / invoice **PDF** per purchase.

### Post-purchase (mini-CRM)
- ☐ "My Leads" dashboard tab (owned leads only) with status tracker
  (new → contacted → converted → dead) — needs `lead_status` /`lead_notes`.
- ☐ Private notes per purchased lead.
- ☐ Follow-up reminder (date picker → scheduled email/notification) — needs a
  **scheduled job** runner.
- ☐ Lead activity timeline (status changes + notes).

### Trust & transparency
- ☐ "Why this price?" tooltip explaining category pricing.
- ☐ Dispute / report button on purchased leads (tied to refund policy).
- ☐ Transparent lead-source tag shown pre-purchase ("From Site Visit Event").

## Shared infrastructure these depend on
- **Email provider** (Resend / SendGrid / SMTP) — RSVP confirmations, waitlist,
  reminders.
- **WhatsApp API** — confirmations & notifications.
- **Payment provider** (Razorpay / Stripe) — the entire marketplace purchase
  flow + wallet.
- **Scheduled jobs** (cron / queue) — follow-up reminders, waitlist promotion.
- **Shared-store rate limiting** (Upstash Redis) — replace the in-memory limiter
  for multi-instance deploys.
