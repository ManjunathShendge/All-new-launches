-- Lead moderation workflow
-- Run this in the Supabase SQL editor.
--
-- Adds an `approval_status` to leads so new enquiries land in an admin queue
-- (pending) and only reach an agent's dashboard once approved.

alter table public.leads
  add column if not exists approval_status text not null default 'pending';

-- Existing leads were already visible to their agents before this change, so
-- keep them visible by marking all current rows approved. (Remove this line if
-- you'd rather re-moderate historical leads from scratch.)
update public.leads set approval_status = 'approved';

-- Constrain to the known values.
alter table public.leads
  drop constraint if exists leads_approval_status_check;
alter table public.leads
  add constraint leads_approval_status_check
  check (approval_status in ('pending', 'approved', 'disapproved'));

-- Helpful indexes for the dashboard queries.
create index if not exists leads_approval_status_idx
  on public.leads (approval_status);
create index if not exists leads_user_approval_idx
  on public.leads (user_id, approval_status);
