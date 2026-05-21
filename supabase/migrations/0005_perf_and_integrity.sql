-- supabase/migrations/0005_perf_and_integrity.sql
--
-- Audit fixes batched into one migration:
--   M-P3: admin/dashboard image queries can't use partial indexes
--   M-P2: missing DB integrity CHECK constraints
--   M-P5: image_tags RLS uses a correlated EXISTS (slow)
--   M-P9: dashboard aggregates pulled entire tables into Node
--
-- All changes are additive and idempotent (`if not exists` / `or replace`).

-- =============================================================================
-- 1. CHECK constraints for numeric integrity (M-P2)
-- =============================================================================
alter table images
  add constraint images_width_positive  check (width  > 0) not valid;
alter table images
  add constraint images_height_positive check (height > 0) not valid;
alter table like_counts
  add constraint like_counts_nonneg     check (count >= 0) not valid;

-- Validate against existing rows; cheap on empty tables.
alter table images       validate constraint images_width_positive;
alter table images       validate constraint images_height_positive;
alter table like_counts  validate constraint like_counts_nonneg;

-- =============================================================================
-- 2. Non-partial composite index for admin/dashboard image lists (M-P3)
-- =============================================================================
-- Admin views need every image (published or not). The partial index
-- `images_created_idx ... where is_published` can't satisfy them.
create index if not exists images_created_all_idx
  on images (created_at desc, id desc);

-- =============================================================================
-- 3. Helper for image_tags RLS (M-P5)
-- =============================================================================
-- Replaces the per-row correlated EXISTS in the `image_tags` RLS policy
-- with a STABLE function. Stable functions are cached per statement and
-- can use the indexed primary key lookup on `images(id)`.
create or replace function is_published_image(p_image_id uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from images
    where id = p_image_id
      and is_published = true
  );
$$;

grant execute on function is_published_image(uuid) to anon, authenticated;

drop policy if exists "anon can read image_tags" on image_tags;
create policy "anon can read image_tags"
  on image_tags for select
  to anon
  using (is_published_image(image_id));

-- =============================================================================
-- 4. Dashboard aggregate RPCs (M-P9)
-- =============================================================================
-- Replace JS-side scan+aggregate with SQL aggregates that can use the
-- relevant indexes and only return small result sets.

create or replace function dashboard_sum_likes()
returns bigint
language sql
stable
as $$
  select coalesce(sum(count), 0)::bigint from like_counts;
$$;

create or replace function dashboard_top_tags(p_limit int default 10)
returns table(name text, slug text, count bigint)
language sql
stable
as $$
  select t.name, t.slug, count(*)::bigint
  from image_tags it
  join tags t on t.id = it.tag_id
  group by t.id
  order by count(*) desc, t.name asc
  limit p_limit;
$$;

create or replace function dashboard_likes_per_day(p_days int default 28)
returns table(day date, likes bigint)
language sql
stable
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
  left join like_events le
    on le.created_at >= d.day::timestamptz
   and le.created_at <  (d.day + 1)::timestamptz
  group by d.day
  order by d.day asc;
$$;

-- Service role bypasses RLS; expose to admin path only. Don't grant to anon.
grant execute on function dashboard_sum_likes()             to authenticated;
grant execute on function dashboard_top_tags(int)           to authenticated;
grant execute on function dashboard_likes_per_day(int)      to authenticated;
