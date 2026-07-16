-- =============================================================================
-- Auto-create a profiles row for every new signup + backfill existing users.
--
-- Root cause this fixes: Supabase Auth creates a row in auth.users on signup,
-- but nothing was creating the matching public.profiles row. Users with no
-- profile row get bounced from their dashboards (getSessionProfile returns null)
-- and the client `profiles` read 406s.
--
-- Signup metadata (raw_user_meta_data) carries: full_name, username, phone,
-- account_type, role — set by AuthService.signup.
-- =============================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, username, phone, account_type, role)
  values (
    new.id,
    new.email,
    coalesce(nullif(new.raw_user_meta_data->>'full_name', ''), split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'phone',
    coalesce(new.raw_user_meta_data->>'account_type', 'user'),
    coalesce(new.raw_user_meta_data->>'role', 'user')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Backfill: create profiles for any existing auth users that don't have one
-- (this fixes accounts that signed up before the trigger existed).
-- ---------------------------------------------------------------------------
insert into public.profiles (id, email, full_name, username, phone, account_type, role)
select
  u.id,
  u.email,
  coalesce(nullif(u.raw_user_meta_data->>'full_name', ''), split_part(u.email, '@', 1)),
  u.raw_user_meta_data->>'username',
  u.raw_user_meta_data->>'phone',
  coalesce(u.raw_user_meta_data->>'account_type', 'user'),
  coalesce(u.raw_user_meta_data->>'role', 'user')
from auth.users u
left join public.profiles p on p.id = u.id
where p.id is null
on conflict (id) do nothing;

-- Verify (optional): should now be 0.
-- select count(*) from auth.users u
-- left join public.profiles p on p.id = u.id where p.id is null;
