-- =============================================================================
-- Concurrency-safe id allocation for property creation.
--
-- properties.id and property_images.id were imported from WordPress as plain
-- bigints with NO sequence, so the app allocated ids as max(id)+1 in JS. Under
-- concurrent inserts (400+ agents/day) two submissions can read the same max and
-- collide on the primary key. This migration attaches a real sequence to each id
-- column (seeded PAST the current max) and makes it the column default, so
-- Postgres hands out unique ids atomically — no collisions, no retries.
--
-- Additive and safe to run on a live table:
--   * Existing rows keep their ids (all below the seed).
--   * The app prefers the sequence but still falls back to max()+1 if this
--     migration hasn't run yet, so code and migration can deploy in any order.
--
-- Idempotent: safe to run more than once.
-- =============================================================================

-- ---- properties.id ----------------------------------------------------------
create sequence if not exists public.properties_id_seq;

-- Seed the sequence so the NEXT nextval() returns max(id)+1 (is_called = false).
select setval(
  'public.properties_id_seq',
  coalesce((select max(id) from public.properties), 0) + 1,
  false
);

alter table public.properties
  alter column id set default nextval('public.properties_id_seq');

-- Tie the sequence's lifecycle to the column.
alter sequence public.properties_id_seq owned by public.properties.id;


-- ---- property_images.id -----------------------------------------------------
create sequence if not exists public.property_images_id_seq;

select setval(
  'public.property_images_id_seq',
  coalesce((select max(id) from public.property_images), 0) + 1,
  false
);

alter table public.property_images
  alter column id set default nextval('public.property_images_id_seq');

alter sequence public.property_images_id_seq owned by public.property_images.id;


-- ---- profiles.old_wp_user_id allocation -------------------------------------
-- New agents (no old_wp_user_id yet) previously got one via a racy max()+1 read;
-- two brand-new agents listing at the same instant could get the SAME id and
-- have their listings mixed together. Allocate from a shared sequence instead.
-- Seed past the current max, with a floor of 100000 to match the app's base.
create sequence if not exists public.profiles_wp_user_id_seq;

select setval(
  'public.profiles_wp_user_id_seq',
  greatest(coalesce((select max(old_wp_user_id) from public.profiles), 0), 100000) + 1,
  false
);

-- Server-only RPC to draw the next WP user id atomically.
create or replace function public.next_wp_user_id()
returns bigint
language sql
security definer
set search_path = public
as $$
  select nextval('public.profiles_wp_user_id_seq');
$$;

-- The service-role key is the only caller (used inside the guarded server
-- action). Keep it away from public / anon / authenticated roles.
revoke execute on function public.next_wp_user_id() from public, anon, authenticated;
grant execute on function public.next_wp_user_id() to service_role;
