-- =============================================================================
-- Saved / shortlisted properties for buyers (the user "wishlist").
--
-- RLS enabled with NO policies — reached only through service-role server
-- actions that scope every query by profile_id. One row per (user, property);
-- the unique constraint makes save/unsave idempotent.
-- =============================================================================

create table if not exists public.saved_properties (
  id          bigint generated always as identity primary key,
  profile_id  uuid   not null references public.profiles (id) on delete cascade,
  property_id bigint not null references public.properties (id) on delete cascade,
  created_at  timestamptz not null default now(),
  unique (profile_id, property_id)
);

create index if not exists saved_properties_profile_idx
  on public.saved_properties (profile_id, created_at desc);

alter table public.saved_properties enable row level security;
