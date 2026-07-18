-- General site enquiries (blog "talk to an expert" form, newsletter, etc.).
-- Not tied to a specific property, so it lives apart from `leads`.
-- Run this in the Supabase SQL editor.

create table if not exists public.site_enquiries (
  id          bigint generated always as identity primary key,
  name        text,
  email       text,
  phone       text,
  message     text,
  interest    text,                      -- e.g. "Apartment", "Investment"
  source      text not null default 'blog',   -- blog | newsletter | contact
  page_url    text,
  created_at  timestamptz not null default now()
);

create index if not exists site_enquiries_created_idx
  on public.site_enquiries (created_at desc);

-- Writes go through the service role (server action); no public access.
alter table public.site_enquiries enable row level security;
