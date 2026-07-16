-- =============================================================================
-- Row Level Security (RLS) hardening
-- Run in the Supabase SQL editor. Review each block before running.
--
-- Access model this app uses:
--   * Public reads (property listings, blog) -> anon/authenticated SELECT.
--   * All privileged reads/writes (dashboards, leads, profile lookups) go
--     through the SERVICE ROLE client, which BYPASSES RLS. So locking these
--     tables down does NOT break the app.
--   * Login reads the caller's own profile row (authenticated) -> needs an
--     own-row SELECT policy.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- profiles: users may read/update ONLY their own row; nobody may self-promote
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Block privilege escalation: a user cannot change their own role/account_type.
-- (The service role bypasses RLS but triggers still run; it is allowed through.)
create or replace function public.prevent_profile_privilege_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (new.role is distinct from old.role)
     or (new.account_type is distinct from old.account_type) then
    if coalesce(auth.role(), '') <> 'service_role' then
      raise exception 'Changing role/account_type is not allowed';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_prevent_profile_privilege_change on public.profiles;
create trigger trg_prevent_profile_privilege_change
  before update on public.profiles
  for each row execute function public.prevent_profile_privilege_change();

-- ---------------------------------------------------------------------------
-- properties: public read, writes only via service role
-- ---------------------------------------------------------------------------
alter table public.properties enable row level security;

drop policy if exists properties_public_read on public.properties;
create policy properties_public_read on public.properties
  for select using (true);
-- If you have unpublished/draft rows, scope the read instead, e.g.:
--   for select using (status = 'publish');
-- (No insert/update/delete policies => only the service role can write.)

-- ---------------------------------------------------------------------------
-- leads: fully locked — every access is via the service role
-- ---------------------------------------------------------------------------
alter table public.leads enable row level security;
-- Intentionally NO policies: anon/authenticated get nothing; capture + admin
-- moderation all run through the service role.

-- ---------------------------------------------------------------------------
-- Apply the same "public read, service-role write" pattern to related tables
-- that back public pages. Uncomment/adjust names to match your schema.
-- ---------------------------------------------------------------------------
-- alter table public.property_images enable row level security;
-- create policy pi_public_read on public.property_images for select using (true);
-- alter table public.floor_plans enable row level security;
-- create policy fp_public_read on public.floor_plans for select using (true);
-- alter table public.amenities enable row level security;
-- create policy am_public_read on public.amenities for select using (true);
-- alter table public.blogs enable row level security;
-- create policy blog_public_read on public.blogs for select using (true);

-- ---------------------------------------------------------------------------
-- Sanity check: list tables that still have RLS DISABLED.
-- ---------------------------------------------------------------------------
-- select relname from pg_class
-- where relnamespace = 'public'::regnamespace and relkind = 'r' and relrowsecurity = false;
