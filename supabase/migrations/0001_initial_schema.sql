-- supabase/migrations/0001_initial_schema.sql

-- -----------------------------------------
-- EXTENSIONS
-- -----------------------------------------

-- -----------------------------------------
-- IMAGES
-- -----------------------------------------
create table images (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  storage_key      text not null,
  storage_provider text not null default 'supabase',
  image_url        text not null,
  width            integer not null,
  height           integer not null,
  prompt           text not null,
  description      text,
  model            text,
  is_published     boolean not null default false,
  display_order    bigint not null default extract(epoch from now())::bigint,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

alter table images add column search_vector tsvector
  generated always as (
    setweight(to_tsvector('english', coalesce(prompt,'')), 'A') ||
    setweight(to_tsvector('english', coalesce(description,'')), 'B') ||
    setweight(to_tsvector('english', coalesce(model,'')), 'C')
  ) stored;

create index images_fts_idx     on images using gin(search_vector);
create index images_created_idx on images (created_at desc, id desc) where is_published;
create index images_order_idx   on images (display_order) where is_published;

-- -----------------------------------------
-- TAGS
-- -----------------------------------------
create table tags (
  id   serial primary key,
  name text unique not null,
  slug text unique not null
);

create table image_tags (
  image_id uuid references images(id) on delete cascade,
  tag_id   int  references tags(id)   on delete cascade,
  primary key (image_id, tag_id)
);
create index image_tags_tag_idx on image_tags(tag_id);

-- -----------------------------------------
-- LIKE COUNTS
-- -----------------------------------------
create table like_counts (
  image_id   uuid primary key references images(id) on delete cascade,
  count      bigint not null default 0,
  updated_at timestamptz not null default now()
);

-- -----------------------------------------
-- SETTINGS (singleton -- always id = 1)
-- -----------------------------------------
create table settings (
  id                integer primary key default 1 check (id = 1),
  featured_image_id uuid references images(id) on delete set null,
  maintenance_mode  boolean not null default false
);
insert into settings (id) values (1);

-- -----------------------------------------
-- updated_at TRIGGER
-- -----------------------------------------
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger images_updated_at
  before update on images
  for each row execute procedure set_updated_at();

create trigger like_counts_updated_at
  before update on like_counts
  for each row execute procedure set_updated_at();

-- -----------------------------------------
-- ROW LEVEL SECURITY
-- -----------------------------------------
alter table images     enable row level security;
alter table tags       enable row level security;
alter table image_tags enable row level security;
alter table like_counts enable row level security;
alter table settings   enable row level security;

-- Public read: published images only
create policy "anon can read published images"
  on images for select
  to anon
  using (is_published = true);

-- Public read: all tags (needed for tag filter UI)
create policy "anon can read tags"
  on tags for select
  to anon
  using (true);

-- Public read: image_tags for published images
create policy "anon can read image_tags"
  on image_tags for select
  to anon
  using (
    exists (
      select 1 from images i
      where i.id = image_id and i.is_published = true
    )
  );

-- Public read: like counts
create policy "anon can read like_counts"
  on like_counts for select
  to anon
  using (true);

-- Public write: like counts (increment only -- enforced in app layer)
create policy "anon can update like_counts"
  on like_counts for update
  to anon
  using (true)
  with check (true);

-- Public read: settings
create policy "anon can read settings"
  on settings for select
  to anon
  using (true);

-- Service role bypasses RLS automatically -- no extra policies needed.
