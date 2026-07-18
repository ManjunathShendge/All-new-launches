-- Premium Properties Showcase (home hero, right side).
-- Two sources of featured items, both admin-managed:
--   1. Company projects  (listing_category = 'company')
--   2. Sponsored listings (listing_category = 'sponsored')
--
-- Run this in the Supabase SQL editor.

create table if not exists public.premium_showcase (
  id                bigint generated always as identity primary key,

  -- General
  name              text        not null,
  slug              text,
  short_description text,
  builder           text,
  property_type     text,
  listing_category  text        not null default 'company'
                                check (listing_category in ('company', 'sponsored')),
  premium_badge     boolean     not null default false,
  sponsored_badge   boolean     not null default false,

  -- Location
  city              text,
  locality          text,
  address           text,
  maps_link         text,

  -- Pricing
  starting_price    numeric,
  price_label       text        not null default 'Onwards',

  -- Status
  status            text        not null default 'new_launch'
                                check (status in ('ready', 'under_construction', 'new_launch', 'coming_soon')),

  -- Media
  cover_image       text,
  gallery_images    text[]      not null default '{}',
  logo              text,

  -- Highlights
  highlights        text[]      not null default '{}',
  rera_number       text,
  possession_date   text,

  -- Trust
  rating            numeric,

  -- CTA
  cta_text          text        not null default 'View Project',
  cta_link          text,

  -- Display settings
  display_order     integer     not null default 0,
  is_active         boolean     not null default true,
  start_date        timestamptz,
  end_date          timestamptz,
  background_theme  text,
  accent_color      text,

  -- Analytics (future ready)
  click_count       integer     not null default 0,
  view_count        integer     not null default 0,
  priority_score    integer     not null default 0,

  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

-- Fast path for the public query: active items, ordered.
create index if not exists premium_showcase_active_idx
  on public.premium_showcase (is_active, display_order, priority_score desc);

-- Keep updated_at fresh on edits.
create or replace function public.touch_premium_showcase()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists premium_showcase_touch on public.premium_showcase;
create trigger premium_showcase_touch
  before update on public.premium_showcase
  for each row execute function public.touch_premium_showcase();

-- ---------------------------------------------------------------------------
-- RLS: public may READ only live items; all writes go through the service role.
-- ---------------------------------------------------------------------------
alter table public.premium_showcase enable row level security;

drop policy if exists premium_showcase_public_read on public.premium_showcase;
create policy premium_showcase_public_read
  on public.premium_showcase
  for select
  using (
    is_active = true
    and (start_date is null or start_date <= now())
    and (end_date   is null or end_date   >= now())
  );

-- ---------------------------------------------------------------------------
-- Click tracking: let anyone bump the counter without a table write policy.
-- ---------------------------------------------------------------------------
create or replace function public.increment_showcase_click(p_id bigint)
returns void
language sql
security definer
set search_path = public
as $$
  update public.premium_showcase
     set click_count = click_count + 1
   where id = p_id;
$$;

revoke execute on function public.increment_showcase_click(bigint) from public;
grant execute on function public.increment_showcase_click(bigint) to anon, authenticated, service_role;
