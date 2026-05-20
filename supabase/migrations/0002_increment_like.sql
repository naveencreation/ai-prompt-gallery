-- supabase/migrations/0002_increment_like.sql

-- -----------------------------------------
-- LIKE COUNTS RPC
-- -----------------------------------------
create or replace function increment_like(p_image_id uuid)
returns bigint
language plpgsql
as $$
declare
  next_count bigint;
begin
  insert into like_counts (image_id, count)
  values (p_image_id, 1)
  on conflict (image_id)
  do update set count = like_counts.count + 1,
                updated_at = now()
  returning count into next_count;

  return next_count;
end;
$$;
