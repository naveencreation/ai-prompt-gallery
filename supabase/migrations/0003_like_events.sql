-- supabase/migrations/0003_like_events.sql

-- -----------------------------------------
-- LIKE EVENTS (timeseries for analytics)
-- -----------------------------------------
create table like_events (
  id         bigserial primary key,
  image_id   uuid not null references images(id) on delete cascade,
  created_at timestamptz not null default now()
);

create index like_events_created_at_idx on like_events (created_at desc);
create index like_events_image_id_idx  on like_events (image_id);

-- RLS
alter table like_events enable row level security;
create policy "anon can read like_events"
  on like_events for select
  to anon
  using (true);
