-- Profile enrichment for agents / property owners: an avatar image URL
-- (delivered from Cloudflare R2) and a short bio / about-me blurb.
--
-- Additive and non-breaking: both columns are nullable, existing rows are
-- untouched. Run before using the enriched Profile tab.

alter table public.profiles
  add column if not exists avatar_url text,
  add column if not exists bio text;
