-- =============================================================================
-- Auto-list the entire lead inventory on the marketplace.
--
-- The marketplace only shows leads that have a marketplace_listings row. This
-- makes EVERY captured lead available automatically — both the existing backlog
-- and any lead captured from now on — at a default price. Admins can still
-- adjust prices or unlist individual leads afterwards (those changes are kept;
-- the backfill/trigger only ever INSERTs for leads that aren't listed yet).
--
-- Change DEFAULT_PRICE below if you want a different starting price.
-- =============================================================================

-- 1) Backfill: list every lead that isn't already listed.
insert into public.marketplace_listings (lead_id, price, active)
select l.id, 500, true
from public.leads l
where not exists (
  select 1 from public.marketplace_listings ml where ml.lead_id = l.id
);

-- 2) Keep it automatic: list each new lead the moment it's captured.
create or replace function public.autolist_lead()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.marketplace_listings (lead_id, price, active)
    values (new.id, 500, true)
    on conflict (lead_id) do nothing;
  return new;
end;
$$;

drop trigger if exists trg_autolist_lead on public.leads;
create trigger trg_autolist_lead
  after insert on public.leads
  for each row execute function public.autolist_lead();
