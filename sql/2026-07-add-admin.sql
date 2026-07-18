-- Promote a user to admin.
-- Precondition: the person has already signed up at /auth with this email
-- (so their auth.users + profiles rows exist).
--
-- Run in the Supabase SQL editor.

-- 1) Promote (matches by auth email -> profile id; robust even if
--    profiles.email is blank for the row).
update public.profiles p
set role = 'admin'
from auth.users u
where u.id = p.id
  and lower(u.email) = lower('thesocialloopofficial@gmail.com');

-- 2) Verify — should return one row with role = 'admin'.
select p.id, u.email, p.role, p.account_type
from public.profiles p
join auth.users u on u.id = p.id
where lower(u.email) = lower('thesocialloopofficial@gmail.com');
