-- =============================================================================
-- Leads Marketplace — schema, RLS, and atomic money functions
-- Run in the Supabase SQL editor.
--
-- Inventory = leads captured from the property-detail lead form (public.leads).
-- The marketplace is INDEPENDENT of the admin approve/disapprove/assign flow:
-- listing a lead for sale never touches leads.approval_status or leads.user_id.
--
-- Security model:
--   * Every table below has RLS enabled with NO policies -> unreachable by the
--     anon/authenticated keys. All access goes through service-role server
--     actions that enforce ownership explicitly.
--   * Wallet debits/credits happen ONLY inside SECURITY DEFINER functions that
--     lock the wallet row (FOR UPDATE) -> no race/double-spend. EXECUTE on those
--     functions is granted to service_role only.
-- =============================================================================

-- Agent credit wallet (1 row per agent/owner profile).
create table if not exists public.agent_wallets (
  profile_id  uuid primary key references public.profiles (id) on delete cascade,
  balance     numeric(12, 2) not null default 0 check (balance >= 0),
  updated_at  timestamptz not null default now()
);

-- Immutable ledger of every wallet movement.
create table if not exists public.wallet_transactions (
  id            bigint generated always as identity primary key,
  profile_id    uuid not null references public.profiles (id) on delete cascade,
  kind          text not null check (kind in ('topup', 'purchase', 'refund', 'grant')),
  amount        numeric(12, 2) not null,          -- +credit / -debit
  balance_after numeric(12, 2) not null,
  reference     text,                             -- payment id / purchase id
  created_at    timestamptz not null default now()
);
create index if not exists wallet_tx_profile_idx
  on public.wallet_transactions (profile_id, created_at desc);

-- A captured lead put up for sale (admin sets the price).
create table if not exists public.marketplace_listings (
  id          bigint generated always as identity primary key,
  lead_id     bigint not null unique references public.leads (id) on delete cascade,
  price       numeric(12, 2) not null check (price >= 0),
  active      boolean not null default true,
  created_by  uuid,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists listings_active_idx on public.marketplace_listings (active);

-- A purchase unlocks a lead's contact for one buyer. One buyer can buy a given
-- lead only once (non-exclusive across different buyers).
create table if not exists public.lead_purchases (
  id             bigint generated always as identity primary key,
  buyer_id       uuid not null references public.profiles (id) on delete cascade,
  lead_id        bigint not null references public.leads (id) on delete cascade,
  listing_id     bigint references public.marketplace_listings (id) on delete set null,
  price          numeric(12, 2) not null,
  invoice_no     text unique,
  status         text not null default 'new'
                   check (status in ('new', 'contacted', 'converted', 'dead')),
  follow_up_date date,
  purchased_at   timestamptz not null default now(),
  unique (buyer_id, lead_id)
);
create index if not exists purchases_buyer_idx
  on public.lead_purchases (buyer_id, purchased_at desc);

-- Private notes + activity timeline (mini-CRM).
create table if not exists public.lead_notes (
  id          bigint generated always as identity primary key,
  purchase_id bigint not null references public.lead_purchases (id) on delete cascade,
  buyer_id    uuid not null references public.profiles (id) on delete cascade,
  body        text not null,
  created_at  timestamptz not null default now()
);
create index if not exists lead_notes_purchase_idx on public.lead_notes (purchase_id);

create table if not exists public.purchase_activity (
  id          bigint generated always as identity primary key,
  purchase_id bigint not null references public.lead_purchases (id) on delete cascade,
  kind        text not null,     -- purchased | status | note | followup | dispute
  detail      text,
  created_at  timestamptz not null default now()
);
create index if not exists purchase_activity_idx on public.purchase_activity (purchase_id, created_at);

-- Disputes / reports on a purchased lead.
create table if not exists public.lead_disputes (
  id          bigint generated always as identity primary key,
  purchase_id bigint not null references public.lead_purchases (id) on delete cascade,
  buyer_id    uuid not null references public.profiles (id) on delete cascade,
  reason      text not null,
  status      text not null default 'open' check (status in ('open', 'resolved', 'rejected')),
  created_at  timestamptz not null default now(),
  resolved_at timestamptz
);

-- Saved filter presets per agent.
create table if not exists public.saved_filters (
  id          bigint generated always as identity primary key,
  profile_id  uuid not null references public.profiles (id) on delete cascade,
  name        text not null,
  filters     jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists saved_filters_profile_idx on public.saved_filters (profile_id);

-- ---------------------------------------------------------------------------
-- RLS: enable on all, add NO policies (service-role only).
-- ---------------------------------------------------------------------------
alter table public.agent_wallets        enable row level security;
alter table public.wallet_transactions  enable row level security;
alter table public.marketplace_listings enable row level security;
alter table public.lead_purchases        enable row level security;
alter table public.lead_notes            enable row level security;
alter table public.purchase_activity     enable row level security;
alter table public.lead_disputes         enable row level security;
alter table public.saved_filters         enable row level security;

-- ---------------------------------------------------------------------------
-- Atomic credit (topup / grant / refund).
-- ---------------------------------------------------------------------------
create or replace function public.credit_wallet(
  p_profile uuid,
  p_amount  numeric,
  p_kind    text,
  p_reference text default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  v_balance numeric;
begin
  if p_amount <= 0 then
    raise exception 'Amount must be positive';
  end if;
  if p_kind not in ('topup', 'grant', 'refund') then
    raise exception 'Invalid credit kind';
  end if;

  insert into public.agent_wallets (profile_id, balance)
    values (p_profile, 0)
    on conflict (profile_id) do nothing;

  update public.agent_wallets
    set balance = balance + p_amount, updated_at = now()
    where profile_id = p_profile
    returning balance into v_balance;

  insert into public.wallet_transactions (profile_id, kind, amount, balance_after, reference)
    values (p_profile, p_kind, p_amount, v_balance, p_reference);

  return v_balance;
end;
$$;

-- ---------------------------------------------------------------------------
-- Atomic purchase: locks the wallet, verifies, debits, records — all or nothing.
-- Returns JSON { ok, error, purchase_id, invoice_no, balance }.
-- ---------------------------------------------------------------------------
create or replace function public.purchase_lead(
  p_buyer   uuid,
  p_listing bigint
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  v_lead     bigint;
  v_price    numeric;
  v_active   boolean;
  v_balance  numeric;
  v_purchase bigint;
  v_invoice  text;
begin
  -- Listing must exist and be active.
  select lead_id, price, active into v_lead, v_price, v_active
    from public.marketplace_listings where id = p_listing;
  if v_lead is null then
    return json_build_object('ok', false, 'error', 'Listing not found.');
  end if;
  if not v_active then
    return json_build_object('ok', false, 'error', 'This lead is no longer available.');
  end if;

  -- Prevent duplicate purchase by the same buyer.
  if exists (select 1 from public.lead_purchases
             where buyer_id = p_buyer and lead_id = v_lead) then
    return json_build_object('ok', false, 'error', 'You already own this lead.');
  end if;

  -- Lock the wallet row and check funds.
  select balance into v_balance
    from public.agent_wallets where profile_id = p_buyer for update;
  if v_balance is null then
    return json_build_object('ok', false, 'error', 'Insufficient credits. Please add credits.');
  end if;
  if v_balance < v_price then
    return json_build_object('ok', false, 'error', 'Insufficient credits. Please add credits.');
  end if;

  -- Debit + record.
  update public.agent_wallets
    set balance = balance - v_price, updated_at = now()
    where profile_id = p_buyer
    returning balance into v_balance;

  insert into public.lead_purchases (buyer_id, lead_id, listing_id, price)
    values (p_buyer, v_lead, p_listing, v_price)
    returning id into v_purchase;

  v_invoice := 'INV-' || to_char(now(), 'YYMM') || '-' || lpad(v_purchase::text, 6, '0');
  update public.lead_purchases set invoice_no = v_invoice where id = v_purchase;

  insert into public.wallet_transactions (profile_id, kind, amount, balance_after, reference)
    values (p_buyer, 'purchase', -v_price, v_balance, v_purchase::text);

  insert into public.purchase_activity (purchase_id, kind, detail)
    values (v_purchase, 'purchased', 'Lead purchased');

  return json_build_object('ok', true, 'purchase_id', v_purchase,
                           'invoice_no', v_invoice, 'balance', v_balance);
end;
$$;

-- Only the service role may execute the money functions.
revoke execute on function public.credit_wallet(uuid, numeric, text, text) from public, anon, authenticated;
revoke execute on function public.purchase_lead(uuid, bigint) from public, anon, authenticated;
grant execute on function public.credit_wallet(uuid, numeric, text, text) to service_role;
grant execute on function public.purchase_lead(uuid, bigint) to service_role;
