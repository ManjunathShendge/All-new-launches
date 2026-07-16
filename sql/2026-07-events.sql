-- =============================================================================
-- Events module — schema + RLS
-- Run in the Supabase SQL editor.
-- =============================================================================

create table if not exists public.events (
  id           bigint generated always as identity primary key,
  slug         text unique not null,
  title        text not null,
  description  text,
  category     text,                       -- e.g. site_visit, launch, webinar
  city         text,
  locality     text,
  venue        text,
  banner_url   text,
  starts_at    timestamptz not null,
  ends_at      timestamptz,
  capacity     integer,                    -- null = unlimited
  status       text not null default 'draft'
                 check (status in ('draft', 'published', 'cancelled')),
  is_featured  boolean not null default false,
  created_by   uuid,                       -- admin profiles.id
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists events_status_starts_idx
  on public.events (status, starts_at);
create index if not exists events_category_idx on public.events (category);
create index if not exists events_locality_idx on public.events (locality);

create table if not exists public.event_registrations (
  id          bigint generated always as identity primary key,
  event_id    bigint not null references public.events (id) on delete cascade,
  name        text not null,
  email       text not null,
  phone       text,
  status      text not null default 'registered'
                check (status in ('registered', 'waitlisted', 'cancelled')),
  notified    boolean not null default false,   -- waitlist -> spot-opened email
  created_at  timestamptz not null default now(),
  unique (event_id, email)
);

create index if not exists event_reg_event_idx
  on public.event_registrations (event_id, status);

-- ---------------------------------------------------------------------------
-- RLS: public can read PUBLISHED events; everything else is service-role only.
-- ---------------------------------------------------------------------------
alter table public.events enable row level security;

drop policy if exists events_public_read on public.events;
create policy events_public_read on public.events
  for select using (status = 'published');
-- No write policies => only the service role (admin actions) can write.

alter table public.event_registrations enable row level security;
-- No policies: registrations are created/read only via the service role
-- (the RSVP server action), never directly by the browser.
