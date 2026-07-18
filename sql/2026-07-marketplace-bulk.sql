-- =============================================================================
-- Bulk lead purchase — buy up to a few thousand leads in ONE atomic transaction.
--
-- Robustness / scale:
--   * The wallet row is locked once (FOR UPDATE), so a buyer's purchases are
--     serialized — no double-spend, no race with a concurrent buy.
--   * All inserts are set-based (one INSERT..SELECT for N leads), not a loop, so
--     buying 2000 leads is a single round-trip and one debit.
--   * All-or-nothing: if the wallet can't cover the purchasable subset, NOTHING
--     is charged or unlocked (the CTE insert is rolled back via exception).
--   * Idempotent per buyer: already-owned or inactive listings are skipped
--     (NOT EXISTS + unique(buyer_id, lead_id)); re-submitting can't double-buy.
--
-- Returns JSON:
--   ok=true  -> { ok, bought, spent, balance }
--   ok=false -> { ok, error, [needed, balance, count] }
-- =============================================================================

create or replace function public.purchase_leads(
  p_buyer    uuid,
  p_listings bigint[]
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
  v_total   numeric;
  v_count   int;
  v_ids     bigint[];
begin
  -- Guard against absurd batch sizes.
  if p_listings is null or array_length(p_listings, 1) is null then
    return json_build_object('ok', false, 'error', 'No leads selected.');
  end if;
  if array_length(p_listings, 1) > 5000 then
    return json_build_object('ok', false, 'error', 'Too many leads at once (max 5000).');
  end if;

  -- Lock the wallet row; serializes this buyer's spending.
  select balance into v_balance
    from public.agent_wallets
    where profile_id = p_buyer
    for update;
  if v_balance is null then
    return json_build_object('ok', false, 'error',
      'Insufficient credits. Please add credits.');
  end if;

  -- Insert the purchasable subset (active, not already owned) in one shot,
  -- capturing the new purchase ids + the amount to charge.
  with ins as (
    insert into public.lead_purchases (buyer_id, lead_id, listing_id, price)
    select p_buyer, ml.lead_id, ml.id, ml.price
      from public.marketplace_listings ml
      where ml.id = any(p_listings)
        and ml.active
        and not exists (
          select 1 from public.lead_purchases lp
          where lp.buyer_id = p_buyer and lp.lead_id = ml.lead_id
        )
    on conflict (buyer_id, lead_id) do nothing
    returning id, price
  )
  select array_agg(id), coalesce(sum(price), 0), count(*)
    into v_ids, v_total, v_count
    from ins;

  if v_count = 0 then
    return json_build_object('ok', false,
      'error', 'None of the selected leads are available to buy.', 'bought', 0);
  end if;

  -- All-or-nothing: undo the inserts if the wallet can't cover them.
  if v_balance < v_total then
    raise exception 'INSUFFICIENT_FUNDS';
  end if;

  -- Debit once.
  update public.agent_wallets
    set balance = balance - v_total, updated_at = now()
    where profile_id = p_buyer
    returning balance into v_balance;

  -- Per-row invoice numbers for the freshly inserted purchases.
  update public.lead_purchases lp
    set invoice_no = 'INV-' || to_char(lp.purchased_at, 'YYMM')
                     || '-' || lpad(lp.id::text, 6, '0')
    where lp.id = any(v_ids) and lp.invoice_no is null;

  -- One ledger row for the whole batch + an activity row per lead.
  insert into public.wallet_transactions
    (profile_id, kind, amount, balance_after, reference)
    values (p_buyer, 'purchase', -v_total, v_balance, 'bulk:' || v_count);

  insert into public.purchase_activity (purchase_id, kind, detail)
    select unnest(v_ids), 'purchased', 'Lead purchased';

  return json_build_object('ok', true, 'bought', v_count,
                           'spent', v_total, 'balance', v_balance);

exception
  when others then
    if sqlerrm = 'INSUFFICIENT_FUNDS' then
      return json_build_object('ok', false,
        'error', 'Insufficient credits for the selected leads.',
        'needed', v_total, 'balance', v_balance, 'count', v_count);
    end if;
    raise;
end;
$$;

revoke execute on function public.purchase_leads(uuid, bigint[])
  from public, anon, authenticated;
grant execute on function public.purchase_leads(uuid, bigint[]) to service_role;


-- =============================================================================
-- Admin "Marketplace Leads" insights — aggregate KPIs + top buyers, computed
-- set-based in Postgres so it scales past millions of purchase rows without
-- shipping them to the app.
-- =============================================================================
create or replace function public.marketplace_insights()
returns json
language sql
security definer
set search_path = public
as $$
  select json_build_object(
    'total_revenue',   coalesce((select sum(price) from public.lead_purchases), 0),
    'leads_sold',      (select count(*) from public.lead_purchases),
    'unique_buyers',   (select count(distinct buyer_id) from public.lead_purchases),
    'active_listings', (select count(*) from public.marketplace_listings where active),
    'buyers', coalesce((
      select json_agg(b) from (
        select lp.buyer_id,
               coalesce(p.full_name, p.email, 'Unknown') as name,
               p.email,
               count(*)         as leads_bought,
               sum(lp.price)    as total_spent,
               max(lp.purchased_at) as last_at
        from public.lead_purchases lp
        left join public.profiles p on p.id = lp.buyer_id
        group by lp.buyer_id, p.full_name, p.email
        order by sum(lp.price) desc
        limit 50
      ) b
    ), '[]'::json)
  );
$$;

revoke execute on function public.marketplace_insights()
  from public, anon, authenticated;
grant execute on function public.marketplace_insights() to service_role;
