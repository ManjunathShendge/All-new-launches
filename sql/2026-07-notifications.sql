-- =============================================================================
-- In-app notifications.
--
-- One row per (recipient, event). Written only by service-role server actions
-- (via the notify() helper); read back scoped to the recipient. RLS on, no
-- policies — unreachable by anon/authenticated keys directly.
-- =============================================================================

create table if not exists public.notifications (
  id           bigint generated always as identity primary key,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  type         text not null,            -- property_approved, new_lead, credits, ...
  title        text not null,
  body         text,
  link         text,                     -- in-app href to open on click
  read         boolean not null default false,
  created_at   timestamptz not null default now()
);

-- Newest-first per recipient, and a partial index for the unread-count query.
create index if not exists notifications_recipient_idx
  on public.notifications (recipient_id, created_at desc);
create index if not exists notifications_unread_idx
  on public.notifications (recipient_id) where not read;

alter table public.notifications enable row level security;
