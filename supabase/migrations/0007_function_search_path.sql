-- supabase/migrations/0007_function_search_path.sql
--
-- Audit follow-up: Supabase `db advisors` flagged all functions in
-- `public` with `function_search_path_mutable` (lint 0011). Mutable
-- search_path lets an attacker who can put a malicious table earlier
-- on the caller's search_path trick a function into using their
-- table instead of ours. Fix: `set search_path = ''` on every
-- function and fully-qualify every reference.
--
-- See: https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable

-- ----------------------------------------------------------------------------
-- 0001: set_updated_at -- generic updated_at trigger
-- ----------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- 0002: increment_like -- atomic like upsert + counter
-- ----------------------------------------------------------------------------
create or replace function public.increment_like(p_image_id uuid)
returns bigint
language plpgsql
set search_path = ''
as $$
declare
  next_count bigint;
begin
  insert into public.like_counts (image_id, count)
  values (p_image_id, 1)
  on conflict (image_id)
  do update set count = public.like_counts.count + 1,
                updated_at = now()
  returning count into next_count;

  return next_count;
end;
$$;

-- ----------------------------------------------------------------------------
-- 0005: is_published_image -- RLS helper for image_tags
-- ----------------------------------------------------------------------------
create or replace function public.is_published_image(p_image_id uuid)
returns boolean
language sql
stable
set search_path = ''
as $$
  select exists (
    select 1
    from public.images
    where id = p_image_id
      and is_published = true
  );
$$;

-- ----------------------------------------------------------------------------
-- 0005: dashboard_sum_likes
-- ----------------------------------------------------------------------------
create or replace function public.dashboard_sum_likes()
returns bigint
language sql
stable
set search_path = ''
as $$
  select coalesce(sum(count), 0)::bigint from public.like_counts;
$$;

-- ----------------------------------------------------------------------------
-- 0005: dashboard_top_tags
-- ----------------------------------------------------------------------------
create or replace function public.dashboard_top_tags(p_limit int default 10)
returns table(name text, slug text, count bigint)
language sql
stable
set search_path = ''
as $$
  select t.name, t.slug, count(*)::bigint
  from public.image_tags it
  join public.tags t on t.id = it.tag_id
  group by t.id
  order by count(*) desc, t.name asc
  limit p_limit;
$$;

-- ----------------------------------------------------------------------------
-- 0005: dashboard_likes_per_day
-- ----------------------------------------------------------------------------
create or replace function public.dashboard_likes_per_day(p_days int default 28)
returns table(day date, likes bigint)
language sql
stable
set search_path = ''
as $$
  with bounds as (
    select (current_date - (p_days - 1))::date as start_day
  ),
  days as (
    select generate_series(b.start_day, current_date, '1 day'::interval)::date as day
    from bounds b
  )
  select d.day, coalesce(count(le.id), 0)::bigint as likes
  from days d
  left join public.like_events le
    on le.created_at >= d.day::timestamptz
   and le.created_at <  (d.day + 1)::timestamptz
  group by d.day
  order by d.day asc;
$$;
