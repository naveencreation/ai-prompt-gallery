-- supabase/migrations/0004_secure_like_counts.sql
--
-- Audit C1 + M-P6: the original `anon can update like_counts` policy used
-- `using (true) with check (true)`, which let any holder of the anon key
-- PATCH any like count to any value via PostgREST. The "increment only --
-- enforced in app layer" comment did not apply to direct REST traffic.
--
-- Fix: drop the policy, revoke direct UPDATE from anon, and channel all
-- like increments through the `increment_like` RPC (created in 0002).
-- The RPC is `SECURITY INVOKER` and called server-side by likeRepo via
-- the service role.

drop policy if exists "anon can update like_counts" on like_counts;

revoke update on like_counts from anon;
revoke update on like_counts from authenticated;

-- Allow anonymous browsers to invoke the increment RPC directly if you
-- ever want to skip the server hop. Safe because the function is the
-- only mutation path and is `+1` only.
grant execute on function increment_like(uuid) to anon, authenticated;
