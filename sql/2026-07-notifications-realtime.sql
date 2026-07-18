-- =============================================================================
-- Realtime for notifications.
--
-- Supabase Realtime (Postgres Changes) respects RLS: a client only receives
-- rows it can SELECT. Our table has RLS on with no policies, so we add a
-- read-own policy. Writes stay service-role only (no insert/update policy), so
-- users still can't create or edit notifications directly.
--
-- Prereq: sql/2026-07-notifications.sql
-- =============================================================================

-- Let a signed-in user read (and thus receive realtime for) their OWN rows.
drop policy if exists notifications_own_read on public.notifications;
create policy notifications_own_read on public.notifications
  for select using (recipient_id = auth.uid());

-- Add the table to the realtime publication (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
