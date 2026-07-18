-- =============================================================================
-- DEMO seed for the notification bell — ALL roles, ALL types.
--
-- Gives each role its own realistic notifications so you can log in as an admin,
-- an agent/owner, or a buyer and see the bell + dropdown working.
--
-- Scope (to avoid spamming all real users):
--   * ALL admins
--   * the 10 most-recent agent/owner accounts
--   * the 10 most-recent buyer (user) accounts
-- Adjust the LIMITs, or swap the source select for `where email ilike '...'`,
-- to target specific accounts.
--
-- Prereq: sql/2026-07-notifications.sql (the table). Re-running just adds more.
-- To find which accounts get seeded:
--   select email, account_type, role from profiles order by created_at desc limit 20;
-- =============================================================================

-- ---- ADMINS (3 unread of 5) -------------------------------------------------
insert into public.notifications (recipient_id, type, title, body, link, read, created_at)
select p.id, v.type, v.title, v.body, v.link, v.read, now() - v.age
from public.profiles p
cross join (values
  ('property_submitted',  'New property pending review', '"Orion Tech Park" was submitted and needs approval.',    '/admin/dashboard', false, interval '15 minutes'),
  ('signup',              'New agent signed up',         'Rohan Mehta just created an account.',                    '/admin/dashboard', false, interval '2 hours'),
  ('marketplace_purchase','Marketplace sale',            'An agent purchased 5 leads for ₹2,500.',                  '/admin/dashboard', false, interval '6 hours'),
  ('event_registration',  'New event registration',      'Priya Nair registered for "Lucknow Launch".',             '/admin/dashboard', true,  interval '1 day'),
  ('property_submitted',  'New property pending review', '"2 BHK in Gomti Nagar" was submitted and needs approval.', '/admin/dashboard', true,  interval '2 days')
) as v(type, title, body, link, read, age)
where p.role = 'admin';

-- ---- AGENTS / OWNERS (4 unread of 6) ---------------------------------------
insert into public.notifications (recipient_id, type, title, body, link, read, created_at)
select p.id, v.type, v.title, v.body, v.link, v.read, now() - v.age
from (
  select id from public.profiles
  where account_type in ('agent', 'owner')
  order by created_at desc
  limit 10
) p
cross join (values
  ('new_lead',            'New enquiry on your listing', 'Aditya S. enquired about "Evar Heights".',                        '/agent/dashboard',   false, interval '20 minutes'),
  ('property_approved',   'Your property is live 🎉',    '"3 BHK in Sultanpur Road" was approved and is now visible to buyers.', '/properties',     false, interval '3 hours'),
  ('credits',             'Credits added to your wallet','₹1,000 was credited by the admin.',                               '/leads-marketplace', false, interval '5 hours'),
  ('purchase',            '5 leads unlocked',            'You spent ₹2,500. Find the contacts under My Leads.',             '/leads-marketplace', false, interval '9 hours'),
  ('topup',               'Wallet top-up successful',    '₹2,000 was added. New balance ₹3,500.',                           '/leads-marketplace', true,  interval '1 day'),
  ('property_disapproved','Your property needs changes', '"Commercial Shop in Powai" was not approved. Review and resubmit.', '/agent/dashboard',  true,  interval '3 days')
) as v(type, title, body, link, read, age);

-- ---- BUYERS (2 unread of 3) -------------------------------------------------
insert into public.notifications (recipient_id, type, title, body, link, read, created_at)
select p.id, v.type, v.title, v.body, v.link, v.read, now() - v.age
from (
  select id from public.profiles
  where account_type = 'user'
  order by created_at desc
  limit 10
) p
cross join (values
  ('enquiry_response', 'An agent responded to your enquiry', 'An agent is following up on your enquiry about "DPS Palladio".', '/properties', false, interval '40 minutes'),
  ('event',            'You''re registered for Site Visit',  'See you there! Details are on the event page.',                 '/events',     false, interval '4 hours'),
  ('enquiry_sent',     'Enquiry sent',                       'Your details were shared for "DPS Palladio". The agent will reach out soon.', '/properties', true, interval '1 day')
) as v(type, title, body, link, read, age);
