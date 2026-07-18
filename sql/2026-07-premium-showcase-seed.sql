-- Demo seed: 3 featured projects for the home hero showcase.
-- Uses public Unsplash image URLs so it works before Cloudflare R2 is set up.
-- Safe to re-run: it clears prior seed rows (by slug) first.
--
-- Run AFTER 2026-07-premium-showcase.sql, in the Supabase SQL editor.

delete from public.premium_showcase
 where slug in ('emerald-heights-gurugram', 'palm-grove-villas', 'skyline-corporate-park');

insert into public.premium_showcase
  (name, slug, short_description, builder, property_type, listing_category,
   premium_badge, sponsored_badge, city, locality, starting_price, price_label,
   status, cover_image, highlights, rera_number, possession_date, rating,
   cta_text, cta_link, display_order, is_active, accent_color, priority_score)
values
  (
    'Emerald Heights',
    'emerald-heights-gurugram',
    'Sky villas with panoramic city views and resort-style amenities.',
    'DLF',
    'Luxury Apartments',
    'company',
    true, false,
    'Gurugram', 'Golf Course Road',
    32500000, 'Onwards',
    'new_launch',
    'https://images.unsplash.com/photo-1545324418-cc1a3fa10c00?auto=format&fit=crop&w=1200&q=80',
    array['Near Metro', 'Clubhouse', '80% Sold'],
    'RERA-GGM-1234-2026',
    'Dec 2027',
    4.8,
    'View Project', '/properties',
    1, true, '#2563EB', 100
  ),
  (
    'Palm Grove Villas',
    'palm-grove-villas',
    'Gated community of independent villas with private gardens.',
    'Sobha Realty',
    'Independent Villas',
    'sponsored',
    true, true,
    'Bengaluru', 'Whitefield',
    48000000, 'Starting From',
    'under_construction',
    'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
    array['Private Pool', 'Gated Community', 'Smart Home'],
    'RERA-KA-5678-2026',
    'Jun 2028',
    4.6,
    'Explore Villas', '/properties',
    2, true, '#F59E0B', 90
  ),
  (
    'Skyline Corporate Park',
    'skyline-corporate-park',
    'Grade-A office spaces in the heart of the business district.',
    'Brigade Group',
    'Commercial Offices',
    'company',
    false, false,
    'Pune', 'Kharadi',
    9500000, 'Onwards',
    'ready',
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
    array['Ready to Move', 'IT Park', 'Metro Connectivity'],
    'RERA-MH-9012-2026',
    'Ready',
    4.7,
    'View Project', '/properties',
    3, true, '#0F172A', 80
  );
