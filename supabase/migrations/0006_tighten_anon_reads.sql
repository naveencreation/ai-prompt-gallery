-- supabase/migrations/0006_tighten_anon_reads.sql
--
-- Audit M-S4 + L-S2: drop anon SELECT on tables that don't need to be
-- reachable from the browser.
--
--   * `settings` — only used by middleware (now via the anon RLS read
--     of the singleton row would still work, but the maintenance flag
--     can equally be served server-side). If you want to drop the
--     anon read entirely, uncomment the lines below. Left enabled by
--     default because the middleware's anon client relies on it.
--
--   * `like_events` — analytics-only table. The app's dashboard reads
--     it via the service role (createAdminClient). The anon SELECT
--     leaked per-image like volume/timing publicly.

drop policy if exists "anon can read like_events" on like_events;

-- Optional: uncomment if you want maintenance mode served via service
-- role only (would also require updating the middleware to switch
-- back to `createAdminClient`).
-- drop policy if exists "anon can read settings" on settings;
