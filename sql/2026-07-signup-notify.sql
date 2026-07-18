-- =============================================================================
-- Notify admins when a new user signs up.
--
-- Fires on every new profiles row (created by the handle_new_user trigger on
-- signup). Inserts one notification per admin. SECURITY DEFINER so it can write
-- to notifications regardless of the caller. Depends on: sql/2026-07-notifications.sql
-- =============================================================================

create or replace function public.notify_admins_new_signup()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.notifications (recipient_id, type, title, body, link)
  select p.id,
         'signup',
         'New ' || coalesce(new.account_type, 'user') || ' signed up',
         coalesce(new.full_name, 'Someone') || ' just created an account.',
         '/admin/dashboard'
  from public.profiles p
  where p.role = 'admin' and p.id <> new.id;
  return new;
end;
$$;

drop trigger if exists trg_notify_admins_new_signup on public.profiles;
create trigger trg_notify_admins_new_signup
  after insert on public.profiles
  for each row execute function public.notify_admins_new_signup();
