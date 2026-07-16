-- =============================================================================
-- Demo seed: 10 published events (+ some registrations for capacity bars)
-- Run AFTER sql/2026-07-events.sql. Safe to re-run (idempotent on slug/email).
-- Dates are relative to now(), so views (Upcoming / This Week / Past) all work.
-- =============================================================================

insert into public.events
  (slug, title, description, category, city, locality, venue, banner_url,
   starts_at, ends_at, capacity, status, is_featured)
values
  ('evt-whitefield-launch',
   'Prestige Whitefield — Grand Launch',
   'Be the first to explore our newest residential towers with launch-day pricing, model flats and on-site loan assistance.',
   'launch', 'Bengaluru', 'Whitefield', 'Prestige Sales Gallery',
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60',
   now() + interval '3 days', now() + interval '3 days' + interval '3 hours',
   50, 'published', true),

  ('evt-sarjapur-sitevisit',
   'Sarjapur Road Site Visit — Weekend Special',
   'Guided site visit with free cab pickup. Walk the plots, check the layout and meet the developer team.',
   'site_visit', 'Bengaluru', 'Sarjapur Road', 'Plot Office, Sarjapur',
   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=60',
   now() + interval '5 days', now() + interval '5 days' + interval '2 hours',
   30, 'published', false),

  ('evt-electronic-city-visit',
   'Electronic City Ready-to-Move Open Day',
   'Tour ready-to-move 2 & 3 BHK homes. Instant booking offers for early visitors.',
   'site_visit', 'Bengaluru', 'Electronic City', 'Tower A Clubhouse',
   'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=60',
   now() + interval '2 days', now() + interval '2 days' + interval '4 hours',
   25, 'published', true),

  ('evt-hsr-openhouse',
   'HSR Layout Villa Open House',
   'Private open house for premium villas. Refreshments and interior design consultation included.',
   'open_house', 'Bengaluru', 'HSR Layout', 'Villa 12, Sector 2',
   'https://images.unsplash.com/photo-1531973576160-7125cd663d86?auto=format&fit=crop&w=800&q=60',
   now() + interval '12 days', now() + interval '12 days' + interval '3 hours',
   20, 'published', false),

  ('evt-nri-webinar',
   'NRI Investment Webinar — India Real Estate 2026',
   'Live online session on NRI-friendly investments, taxation, and financing. Q&A with experts.',
   'webinar', null, null, 'Online (Zoom)',
   'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=60',
   now() + interval '8 days', now() + interval '8 days' + interval '90 minutes',
   null, 'published', false),

  ('evt-indiranagar-meetup',
   'Investor Meetup — Indiranagar',
   'Network with fellow investors and brokers. Short talks on emerging micro-markets.',
   'meetup', 'Bengaluru', 'Indiranagar', 'The Leela, Old Airport Rd',
   'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&w=800&q=60',
   now() + interval '18 days', now() + interval '18 days' + interval '2 hours',
   40, 'published', true),

  ('evt-hebbal-launch',
   'Hebbal Skyline — Pre-Launch Preview',
   'Exclusive pre-launch preview with founder pricing for the first 100 registrations.',
   'launch', 'Bengaluru', 'Hebbal', 'Skyline Experience Centre',
   'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=60',
   now() + interval '25 days', now() + interval '25 days' + interval '3 hours',
   100, 'published', false),

  ('evt-koramangala-openhouse',
   'Koramangala Boutique Apartments Open House',
   'Limited boutique apartments open for viewing. Meet the architect on site.',
   'open_house', 'Bengaluru', 'Koramangala', '80 Ft Road Project',
   'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=800&q=60',
   now() + interval '30 days', now() + interval '30 days' + interval '3 hours',
   15, 'published', false),

  ('evt-past-webinar',
   'Home Loan Masterclass (Recording Available)',
   'A past webinar covering home-loan eligibility, interest rates and paperwork.',
   'webinar', null, null, 'Online',
   'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=60',
   now() - interval '5 days', now() - interval '5 days' + interval '90 minutes',
   null, 'published', false),

  ('evt-past-sitevisit',
   'Whitefield Site Visit (Completed)',
   'A recently completed guided site visit event.',
   'site_visit', 'Bengaluru', 'Whitefield', 'Prestige Sales Gallery',
   'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=800&q=60',
   now() - interval '12 days', now() - interval '12 days' + interval '2 hours',
   30, 'published', false)
on conflict (slug) do nothing;

-- ---------------------------------------------------------------------------
-- Registrations to drive the capacity progress bars.
--   whitefield-launch : 42/50   (filling up)
--   electronic-city   : 25/25   (FULL -> new RSVPs go to waitlist)
--   sarjapur          : 11/30
-- ---------------------------------------------------------------------------
insert into public.event_registrations (event_id, name, email, phone, status)
select e.id, 'Demo Attendee ' || g,
       'demo' || g || '@' || e.slug || '.test', '90000' || lpad(g::text, 5, '0'),
       'registered'
from public.events e
join lateral generate_series(1, 42) g on true
where e.slug = 'evt-whitefield-launch'
on conflict (event_id, email) do nothing;

insert into public.event_registrations (event_id, name, email, phone, status)
select e.id, 'Demo Attendee ' || g,
       'demo' || g || '@' || e.slug || '.test', '90000' || lpad(g::text, 5, '0'),
       'registered'
from public.events e
join lateral generate_series(1, 25) g on true
where e.slug = 'evt-electronic-city-visit'
on conflict (event_id, email) do nothing;

insert into public.event_registrations (event_id, name, email, phone, status)
select e.id, 'Demo Attendee ' || g,
       'demo' || g || '@' || e.slug || '.test', '90000' || lpad(g::text, 5, '0'),
       'registered'
from public.events e
join lateral generate_series(1, 11) g on true
where e.slug = 'evt-sarjapur-sitevisit'
on conflict (event_id, email) do nothing;
