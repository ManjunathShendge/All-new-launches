-- Trending locations for the home page — computed from real property data.
-- "Trending" = localities with the most active public listings, with their most
-- common city and the average asking price. Aggregated in Postgres for speed.
--
-- Run in the Supabase SQL editor.

create or replace function public.trending_locations(p_limit int default 6)
returns table (
  locality  text,
  city      text,
  listings  int,
  avg_price numeric
)
language sql
stable
as $$
  select
    p.locality,
    mode() within group (order by p.city)              as city,
    count(*)::int                                        as listings,
    round(avg(coalesce(p.min_price, p.max_price)))::numeric as avg_price
  from public.properties p
  where (p.status is null or p.status not in ('pending', 'rejected'))
    and p.locality is not null
    and btrim(p.locality) <> ''
  group by p.locality
  order by count(*) desc, p.locality asc
  limit greatest(1, least(coalesce(p_limit, 6), 24));
$$;

grant execute on function public.trending_locations(int)
  to anon, authenticated, service_role;
