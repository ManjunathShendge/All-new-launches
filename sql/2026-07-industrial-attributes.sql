-- Industrial / shop listings carry a handful of specs that don't map to any
-- existing properties column (shop frontage, ceiling height, washroom,
-- mezzanine, main-road-facing, corner-shop, suitable-for tags). Rather than
-- add a column per attribute, store them together in a single jsonb blob.
--
-- Additive and non-breaking: existing inserts that don't set the column just
-- leave it NULL. Run this BEFORE submitting a Sell -> Industrial listing.

alter table public.properties
  add column if not exists extra_attributes jsonb;
