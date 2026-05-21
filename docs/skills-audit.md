# Skills Audit Report

Audit of this codebase against the three skill packs in [.agents/skills/](../.agents/skills/):

- `supabase` — auth, RLS, security checklist, env-var exposure, storage perms
- `supabase-postgres-best-practices` — schema, indexes, RLS perf, pagination, FK indexes
- `shadcn` — UI components (forms, icons, styling, composition)

Read-only audit — no code changes proposed beyond the per-finding fix sketches. Cite rule files relative to `.agents/skills/`.

---

## Executive summary

### Counts by severity

| Skill | Critical | High | Medium | Low | Pass |
|---|---|---|---|---|---|
| supabase | 1 | 2 | 5 | 4 | 12 |
| supabase-postgres-best-practices | 0 | 1 | 9 | 2 | 11 |
| shadcn | 0 | 8 | 15 | 4 | 7 |
| **Total** | **1** | **11** | **29** | **10** | **30** |

### Top 5 most impactful findings (fix-first list)

1. **(Critical)** [`supabase/migrations/0001_initial_schema.sql:131-135`](../supabase/migrations/0001_initial_schema.sql) — RLS policy `anon can update like_counts using (true) with check (true)` lets anyone with the anon key set any image's like count to any value via PostgREST. The "enforced in app layer" comment doesn't apply to direct REST calls.
2. **(High)** [`lib/auth/index.ts:24-27`](../lib/auth/index.ts) — `requireAdminSession` accepts **any** logged-in Supabase user as an admin. There is no `app_metadata.role` check, allowlist, or RLS tied to admin identity. Any registered user can create / update / delete images.
3. **(High)** [`app/layout.tsx:39-44`](../app/layout.tsx) — `<Toaster />` from sonner is never mounted, so every `toast.success(...)` / `toast.error(...)` call in `UploadForm` silently no-ops. Users get zero feedback on upload success or failure.
4. **(High)** [`lib/repos/tagRepo.ts:52-74`](../lib/repos/tagRepo.ts) — Tag-filtered gallery queries `image_tags` as the driving table with no `created_at` order, no `is_published` filter, and no keyset cursor. Cannot use `images_created_idx`; will degrade linearly with tag size.
5. **(High)** [`app/admin/(auth)/login/page.tsx`](../app/admin/(auth)/login/page.tsx) + [`components/admin/upload/UploadForm.tsx`](../components/admin/upload/UploadForm.tsx) — Forms use raw `div` + `Label` + `Input` + manual `<p className="text-red-600">` validation instead of `FieldGroup` / `Field` / `data-invalid` per `rules/forms.md`. The `field` shadcn component isn't installed.

---

## Critical findings

### C1. Anon role can overwrite any `like_counts` row to any value

- **Rule**: `supabase/SKILL.md` — *Security checklist → RLS, views, and privileged database code*
- **Location**: [`supabase/migrations/0001_initial_schema.sql:131-135`](../supabase/migrations/0001_initial_schema.sql)
- **Evidence**:

```sql
create policy "anon can update like_counts"
  on like_counts for update
  to anon
  using (true)
  with check (true);
```

- **Issue**: Anyone holding the publishable / anon key (which is exposed to every browser) can PATCH any row in `like_counts` to any value via the auto-generated PostgREST endpoint. The migration comment "increment only — enforced in app layer" is wishful thinking: the app layer doesn't sit between the browser and PostgREST.
- **Fix**: Drop this policy. You already have the RPC [`supabase/migrations/0002_increment_like.sql`](../supabase/migrations/0002_increment_like.sql) — restrict like increments to that function and grant `execute` to `anon`/`authenticated` if you want browser-driven likes, or keep using `createAdminClient()` server-side as `lib/repos/likeRepo.ts` already does. Add `revoke update on like_counts from anon;` to be explicit.

---

## High findings

### H1. Admin gates check "any logged-in user", not admin role *(supabase)*

- **Rule**: `supabase/SKILL.md` — *Auth and session security*
- **Location**: [`lib/auth/index.ts:24-27`](../lib/auth/index.ts)
- **Evidence**:

```ts
export async function requireAdminSession(request: NextRequest) {
  const user = await getOptionalSession(request)
  if (!user) throw new Error('UNAUTHORIZED')
  return user
}
```

- **Issue**: Combined with `auth.enable_signup = true` in [`supabase/config.toml:171`](../supabase/config.toml), any user who can register can hit every `/api/admin/*` endpoint and the `POST/PUT/DELETE /api/images` routes.
- **Fix**: Store admin status in `app_metadata` (NOT `user_metadata` — the skill calls that out as user-editable). Check it in `requireAdminSession`:

```ts
const isAdmin = user.app_metadata?.role === 'admin'
if (!isAdmin) throw new Error('FORBIDDEN')
```

Mirror it in RLS for any future authenticated write paths. Either set this manually via SQL for known admin user IDs, or disable public signup in Supabase and only invite admins.

### H2. Tag filter query cannot use the partial composite index *(pg-best-practices)*

- **Rule**: `supabase-postgres-best-practices/references/query-composite-indexes.md`
- **Location**: [`lib/repos/tagRepo.ts:52-74`](../lib/repos/tagRepo.ts) + [`supabase/migrations/0001_initial_schema.sql:52`](../supabase/migrations/0001_initial_schema.sql)
- **Evidence**:

```ts
// tagRepo.ts:66-70
.from('image_tags')
.select('images(id, slug, image_url, width, height, prompt, created_at)')
.eq('tag_id', tag.id)
.limit(limit)
```

Available indexes: `image_tags_tag_idx on image_tags(tag_id)` and `images_created_idx on images (created_at desc, id desc) where is_published`. The query drives from `image_tags`, so the partial composite index on `images` is unusable.

- **Issue**: As tags grow, this fetches all `image_tags` rows for a tag, joins images, then sorts in memory (with no order at all currently). No `is_published` filter either, so unpublished images may leak.
- **Fix**: Re-shape the query to drive from `images` with `is_published = true`, then filter via `image_tags`:

```ts
.from('images')
.select('id, slug, image_url, width, height, prompt, created_at, image_tags!inner(tag_id)')
.eq('is_published', true)
.eq('image_tags.tag_id', tag.id)
.order('created_at', { ascending: false })
.order('id', { ascending: false })
.limit(limit + 1)
```

Then add keyset cursor support matching [`lib/repos/imageRepo.ts:13-37`](../lib/repos/imageRepo.ts).

### H3. `<Toaster />` is not mounted — every `toast()` call silently no-ops *(shadcn)*

- **Rule**: `shadcn/rules/composition.md` — *Toast notifications use sonner*
- **Location**: [`app/layout.tsx:39-44`](../app/layout.tsx)
- **Evidence**:

```tsx
<ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
  <TooltipProvider>
    {children}
  </TooltipProvider>
</ThemeProvider>
```

`UploadForm` calls `toast.success(...)` / `toast.error(...)`, but `<Toaster />` (`components/ui/sonner.tsx`) is never rendered.

- **Issue**: Users see no feedback for upload success/failure.
- **Fix**: Import `<Toaster />` from `@/components/ui/sonner` and place it inside `<ThemeProvider>`, next to `{children}`.

### H4–H6. Login form uses raw `div`/`Label`/`Input` + manual `<p>` validation *(shadcn)*

- **Rule**: `shadcn/rules/forms.md` — *Forms use FieldGroup + Field* and *Field validation uses data-invalid + aria-invalid*
- **Location**:
  - H4 — [`app/admin/(auth)/login/page.tsx:52-76`](../app/admin/(auth)/login/page.tsx)
  - H5 — [`components/admin/upload/UploadForm.tsx:120-134`](../components/admin/upload/UploadForm.tsx)
  - H6 — Same file, line 131-133 plus login page line 77
- **Evidence**:

```tsx
// login page
<form onSubmit={handleSubmit} className="space-y-5">
  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" ... />
  </div>
  ...
  {error && <p className="text-sm text-red-600">{error}</p>}
</form>

// UploadForm
{errors.prompt && (
  <p className="text-sm text-destructive">{errors.prompt.message}</p>
)}
```

- **Issue**: `field` component (`components/ui/field.tsx`) isn't installed. All form layout, labels, and validation are hand-rolled — violates four `rules/forms.md` rules at once.
- **Fix**:
  1. `npx shadcn@latest add field`
  2. Refactor to `<FieldGroup><Field data-invalid={!!error}><FieldLabel htmlFor="email">Email</FieldLabel><Input id="email" aria-invalid={!!error} /><FieldDescription>{error}</FieldDescription></Field></FieldGroup>`

### H7. `DropdownMenuItem`s not wrapped in `DropdownMenuGroup` *(shadcn)*

- **Rule**: `shadcn/rules/composition.md` — *Items always inside their Group*
- **Location**: [`components/admin/UserMenu.tsx:44-51`](../components/admin/UserMenu.tsx)
- **Fix**: Wrap each set of related items in `<DropdownMenuGroup>`.

### H8–H10. `space-y-*` used instead of `flex flex-col gap-*` *(shadcn)*

- **Rule**: `shadcn/rules/styling.md` — *No `space-x-*` or `space-y-*`*
- **Locations**:
  - [`app/admin/(auth)/login/page.tsx:47,52,64`](../app/admin/(auth)/login/page.tsx) — `space-y-1`, `space-y-5`, `space-y-2`
  - [`app/admin/(authed)/dashboard/page.tsx:47`](../app/admin/(authed)/dashboard/page.tsx) — `space-y-6`
  - [`app/admin/(authed)/upload/page.tsx:10`](../app/admin/(authed)/upload/page.tsx) — `space-y-6`
- **Fix**: Replace with `flex flex-col gap-N`.

---

## Medium findings

### Supabase

#### M-S1. API route handlers don't write refreshed auth cookies back

- **Rule**: `supabase/SKILL.md` — *@supabase/ssr cookie pattern*
- **Location**: [`lib/auth/index.ts:14-15`](../lib/auth/index.ts) — `setAll() {}` is a no-op
- **Issue**: Long-lived admin sessions may fail to refresh, unlike the routes that go through `createRouteClient`.
- **Fix**: Use the route-handler `setAll` pattern from `@supabase/ssr` docs, or route every admin call through `createRouteClient()` so cookies refresh.

#### M-S2. No explicit Data API GRANTs in migrations

- **Rule**: `supabase/SKILL.md` — *Exposing tables to the Data API*
- **Location**: [`supabase/migrations/0001_initial_schema.sql`](../supabase/migrations/0001_initial_schema.sql) — entire file (no `grant ... to anon|authenticated`)
- **Issue**: RLS is enabled, but the migrations never grant table privileges. Depending on the cloud project's Data API settings, tables may either be exposed (relying on RLS alone) or not exposed at all. The repo can't tell.
- **Fix**: Either add explicit `grant select on images to anon;` etc. for tables intentionally exposed, or document that this codebase relies on Supabase's default `public` schema exposure. Run `supabase db advisors` to confirm.

#### M-S3. Maintenance-mode cache miss is a thundering herd

- **Rule**: `supabase/SKILL.md` — *Recover from errors, don't loop* + general perf
- **Location**: [`middleware.ts:62-71`](../middleware.ts)
- **Evidence**: `cache.get` returns `null` → `createAdminClient()` + `from('settings').select(...)` on every uncached request. `lib/cache/factory.ts` defaults to `MemoryCache` with no locking.
- **Fix**: Single-flight the lookup (e.g. lock key in cache), use Upstash Redis in prod, or set the value to `false` immediately so subsequent requests are cached even on error. Also: use the anon client here — the existing `"anon can read settings"` policy already permits the read; service role isn't needed.

#### M-S4. `anon` can read `like_events` timeseries

- **Rule**: `supabase/SKILL.md` — *RLS policies match access model*
- **Location**: [`supabase/migrations/0003_like_events.sql:17-20`](../supabase/migrations/0003_like_events.sql)
- **Issue**: Exposes per-image like volume/timing publicly. May or may not be intentional.
- **Fix**: If analytics shouldn't be public, drop the anon SELECT and query via service role.

#### M-S5. Public homepage uses service role unnecessarily

- **Rule**: `supabase/SKILL.md` — *Never expose service_role unnecessarily*
- **Location**: `app/page.tsx:5-10` (rendering published images)
- **Issue**: The `"anon can read published images"` RLS policy already permits this; using `createAdminClient()` bypasses RLS for no benefit and widens blast radius if the page is ever changed to filter on user input.
- **Fix**: Use anon client (`createBrowserClient` server-side, or the route-handler client).

### Postgres best practices

#### M-P1. UUIDv4 PKs fragment B-tree under heavy insert load

- **Rule**: `references/schema-primary-keys.md`
- **Location**: [`supabase/migrations/0001_initial_schema.sql:11`](../supabase/migrations/0001_initial_schema.sql) — `id uuid primary key default gen_random_uuid()`
- **Fix**: For high-write scale, switch to `uuidv7` (via `pg_uuidv7` extension) or `bigint generated always as identity`. Not urgent until >100k rows/day inserts.

#### M-P2. No DB-level integrity checks on `width`, `height`, `count`

- **Rule**: `references/schema-constraints.md`
- **Location**: [`supabase/migrations/0001_initial_schema.sql:16-17,59`](../supabase/migrations/0001_initial_schema.sql)
- **Fix**: Add `check (width > 0)`, `check (height > 0)`, `check (count >= 0)`.

#### M-P3. Admin/dashboard image queries can't use partial indexes

- **Rule**: `references/query-partial-indexes.md` + `query-missing-indexes.md`
- **Locations**: [`lib/repos/imageRepo.ts:63-70`](../lib/repos/imageRepo.ts) (`findAllImages`), [`lib/repos/dashboardRepo.ts:108-114`](../lib/repos/dashboardRepo.ts) (`getRecentImages`)
- **Issue**: These don't filter `is_published`, so the partial indexes `images_created_idx` and `images_order_idx` can't be used. Sequential scan + sort at scale.
- **Fix**: Add a non-partial admin index:

```sql
create index images_created_all_idx on images (created_at desc, id desc);
```

#### M-P4. Gallery index could be covering

- **Rule**: `references/query-covering-indexes.md`
- **Location**: [`supabase/migrations/0001_initial_schema.sql:35`](../supabase/migrations/0001_initial_schema.sql) vs [`lib/repos/imageRepo.ts:7-8`](../lib/repos/imageRepo.ts) `SELECT_PUBLIC` (10 columns)
- **Fix** (verify with `EXPLAIN` first):

```sql
create index images_created_cover_idx
  on images (created_at desc, id desc)
  include (slug, image_url, width, height, prompt, description, model, display_order)
  where is_published;
```

#### M-P5. Correlated EXISTS in `image_tags` RLS policy

- **Rule**: `references/security-rls-performance.md`
- **Location**: [`supabase/migrations/0001_initial_schema.sql:114-122`](../supabase/migrations/0001_initial_schema.sql)
- **Issue**: Per-row `EXISTS (SELECT 1 FROM images WHERE ...)` subquery — same class of cost as unwrapped `auth.uid()`.
- **Fix**: Wrap into a stable function `is_published_image(uuid)` with `STABLE` and indexed lookup, or expose a view joining `image_tags → images where is_published`.

#### M-P6. `anon can update like_counts` privilege is way too broad

- **Rule**: `references/security-privileges.md`
- **Location**: Same as C1 — second restatement from a privileges-rule angle.
- **Fix**: Same as C1.

#### M-P7. Tag-filter and full-text search pagination is missing

- **Rule**: `references/data-pagination.md`
- **Locations**: [`lib/repos/tagRepo.ts:74`](../lib/repos/tagRepo.ts) (`nextCursor: null` always), [`lib/search/postgres.ts:5-14`](../lib/search/postgres.ts) (`opts.cursor` ignored)
- **Fix**: Add keyset predicates matching the sort columns. For search, sort by `(ts_rank desc, id desc)`.

#### M-P8. Tag upsert is N+1 + has a select-then-insert race

- **Rule**: `references/data-batch-inserts.md` + `references/data-upsert.md`
- **Location**: [`lib/repos/tagRepo.ts:25-40`](../lib/repos/tagRepo.ts) (`findOrCreateTag`), [`lib/services/imageService.ts:73-75`](../lib/services/imageService.ts) (`Promise.all` over `findOrCreateTag`)
- **Fix**: Single batch upsert:

```ts
.from('tags')
.upsert(tagInputs, { onConflict: 'slug', ignoreDuplicates: false })
.select('id, name, slug')
```

#### M-P9. Dashboard aggregates pull entire tables into Node

- **Rule**: `references/data-n-plus-one.md`
- **Locations**: [`lib/repos/dashboardRepo.ts:32-36`](../lib/repos/dashboardRepo.ts) (`sumLikes`), [`lib/repos/dashboardRepo.ts:81-105`](../lib/repos/dashboardRepo.ts) (`getTopTags`)
- **Issue**: `sumLikes` fetches all `like_counts.count` and sums in JS; `getTopTags` fetches all `image_tags` and groups in JS.
- **Fix**: Push aggregation into a Postgres view or RPC:

```sql
create or replace function dashboard_top_tags(p_limit int default 10)
returns table(name text, slug text, count bigint)
language sql stable as $$
  select t.name, t.slug, count(*)::bigint
  from image_tags it join tags t on t.id = it.tag_id
  group by t.id order by count(*) desc limit p_limit;
$$;
```

### Shadcn

#### M-Sh1–M-Sh3. Status / error colors use raw Tailwind palette

- **Rule**: `rules/styling.md` — *Use semantic colors*
- **Locations**:
  - [`app/admin/(auth)/login/page.tsx:77`](../app/admin/(auth)/login/page.tsx) — `text-red-600`
  - [`app/admin/(auth)/layout.tsx:5`](../app/admin/(auth)/layout.tsx) — `from-indigo-50 dark:from-indigo-950/20`
- **Fix**: Use `text-destructive` for errors. For the brand gradient, define `--color-brand` in `@theme inline` instead of `dark:` overrides.

#### M-Sh4. Equal width/height not using `size-*`

- **Rule**: `rules/styling.md`
- **Location**: [`app/admin/(auth)/layout.tsx:7-8`](../app/admin/(auth)/layout.tsx) — `h-9 w-9` and `h-5 w-5`
- **Fix**: `size-9` and `size-5`.

#### M-Sh5. Template-literal className instead of `cn()`

- **Rule**: `rules/styling.md` — *Use `cn()` for conditional classes*
- **Location**: [`app/layout.tsx:37`](../app/layout.tsx)
- **Fix**: `className={cn(geistSans.variable, geistMono.variable, outfit.variable, "h-full antialiased")}`.

#### M-Sh6–M-Sh8. Typography/color overrides on component primitives

- **Rule**: `rules/styling.md` — *className for layout only*
- **Locations**: `components/admin/StatCard.tsx:23-24`, `components/admin/upload/TagCombobox.tsx:64-67`, `components/admin/UserMenu.tsx:30`

#### M-Sh9. `Button` simulates `isLoading` with `Loader2` instead of `Spinner`

- **Rule**: `rules/composition.md` — *Button has no `isPending`/`isLoading`*
- **Location**: [`components/admin/upload/UploadForm.tsx:188-191`](../components/admin/upload/UploadForm.tsx)
- **Fix**: `npx shadcn@latest add spinner`, then `<Button disabled><Spinner data-icon="inline-start" />Uploading…</Button>`.

#### M-Sh10–M-Sh13. Icons in `Button` missing `data-icon` / using sizing classes

- **Rule**: `rules/icons.md`
- **Locations**: `components/admin/CommandPalette.tsx:41-47`, `components/admin/ThemeToggle.tsx:11-18`, `components/admin/upload/UploadDropzone.tsx:87-89`, `components/admin/upload/TagCombobox.tsx:55,69,110`, `components/admin/upload/UploadForm.tsx:189`

#### M-Sh14–M-Sh15. Custom empty-state copy instead of `Empty` component

- **Rule**: `rules/composition.md` — *Empty states use Empty*
- **Locations**: [`components/admin/RecentUploads.tsx:45-47`](../components/admin/RecentUploads.tsx), [`components/admin/TopTagsCard.tsx:30-32`](../components/admin/TopTagsCard.tsx)
- **Fix**: `npx shadcn@latest add empty`, then compose `<Empty><EmptyHeader><EmptyTitle>…</EmptyTitle></EmptyHeader></Empty>`.

#### M-Sh16. Related switch + label not in `FieldSet`

- **Rule**: `rules/forms.md`
- **Location**: [`components/admin/upload/UploadForm.tsx:170-185`](../components/admin/upload/UploadForm.tsx)
- **Fix**: Wrap in `FieldSet` with horizontal `Field`.

---

## Low findings

### Supabase

- **L-S1.** Config only accepts legacy `NEXT_PUBLIC_SUPABASE_ANON_KEY`. Cloud now issues `sb_publishable_...`. Future-proof by accepting either name in [`lib/config.ts:7`](../lib/config.ts).
- **L-S2.** `anon can read settings` exposes `maintenance_mode` + `featured_image_id`. Drop if not used client-side.
- **L-S3.** [`app/api/health/route.ts`](../app/api/health/route.ts) uses service role and leaks internal adapter names publicly. Use anon client + minimal response, or protect with a secret.
- **L-S4.** Dead helper at `utils/supabase/middleware.ts` (from the Supabase quickstart) drifts from the live `middleware.ts` cookie pattern. Delete it.

### Postgres

- **L-P1.** Consider BRIN index on `like_events.created_at` once the table is large (>10M rows). See `references/query-index-types.md`.
- **L-P2.** `[db.pooler] enabled = false` in `supabase/config.toml`. Fine because all app traffic is REST (Supavisor handles pooling in cloud). Only matters if you add direct `pg`/`drizzle` clients — then use port 6543 and disable prepared statements.

### Shadcn

- **L-Sh1.** `--success` defined in `:root` but not registered in `@theme inline`. Tailwind v4 may not generate `bg-success` reliably. See [`app/globals.css:7-48,70-71`](../app/globals.css). Add `--color-success: var(--success);` in `@theme inline`.
- **L-Sh2.** Manual `z-10` on sidebar at [`components/admin/AdminSidebar.tsx:20`](../components/admin/AdminSidebar.tsx) — `rules/styling.md` discourages explicit z-index unless required.
- **L-Sh3.** Custom progress bar in `TopTagsCard.tsx:22-26`. Optional: `npx shadcn@latest add progress`.
- **L-Sh4.** `text-[10px]` on `Badge` in `RecentUploads.tsx:38` — typography override.

---

## Positive observations

What the codebase already does right (don't break these in fixes):

**Supabase / auth**
- Root [`middleware.ts:41`](../middleware.ts) uses `getUser()` (server-validated), not `getSession()` (cookie-trusting).
- Middleware sets cookies on **both** `request` and `response` per the `@supabase/ssr` contract.
- No `getSession()` calls anywhere in `app/api/` or `lib/auth/` (grep clean).
- `SUPABASE_SERVICE_ROLE_KEY` is never `NEXT_PUBLIC_` and never imported in client components.
- No use of `user_metadata` / `raw_user_meta_data` for authorization.
- RLS enabled on all 6 tables in migrations 0001 + 0003.
- No `CREATE VIEW` or `SECURITY DEFINER` functions in migrations.
- Likes go through the `increment_like` RPC with atomic `ON CONFLICT DO UPDATE`.
- Zod-validated env at startup ([`lib/config.ts`](../lib/config.ts)) catches misconfig before runtime.
- Supabase CLI dev dep `^2.100.1` meets the skill's `>= 2.79.0` / `>= 2.81.3` thresholds.

**Postgres**
- Partial index `images_created_idx (created_at desc, id desc) where is_published` matches the gallery query exactly.
- FTS done correctly: generated `tsvector` with A/B/C weighting, GIN index.
- Keyset (cursor) pagination via [`lib/utils/cursor.ts`](../lib/utils/cursor.ts) for main gallery and admin lists.
- All FKs have either a dedicated index or are covered by a composite PK's leftmost column.
- Singleton constraint `check (id = 1)` on `settings`.
- Lowercase snake_case identifiers throughout.

**Shadcn**
- Card composition is correct on dashboard cards (`CardHeader` / `CardTitle` / `CardDescription` / `CardContent`).
- `gap-*` used in admin layouts (it's only inside `<form>` and a few page wrappers that `space-y-*` slipped in).
- `truncate` used correctly in `RecentUploads` (no manual ellipsis triplets).
- `Skeleton` drives dashboard loading states (no hand-rolled `animate-pulse`).
- `Badge` used for status; `Avatar` + `AvatarFallback` in `UserMenu`.
- `cn()` utility in [`lib/utils.ts`](../lib/utils.ts) matches shadcn convention.
- `asChild` correctly used on radix triggers (project is `radix-nova`).
- Icons passed as component objects in `CommandPalette`, not string keys.
- `iconLibrary: "lucide"` in `components.json` matches `package.json`.
- Test coverage across services, repos, route handlers (Vitest).

---

## Out-of-scope (run these yourself)

These checks need a live cloud project, dashboard access, or runtime data — the audit can't verify from source alone.

### Supabase

| Check | Command / action |
|---|---|
| Security advisors | `npx supabase db advisors` (CLI ≥ 2.81.3) or MCP `get_advisors` |
| Data API table exposure | Dashboard → Project Settings → Data API → confirm which tables are exposed to `anon` / `authenticated` |
| Storage bucket policies for `images` bucket | Dashboard → Storage → Policies — confirm signed-upload + public read match your intent (no bucket SQL in repo) |
| `increment_like` grants | `select grantee, privilege_type from information_schema.role_routine_grants where routine_name = 'increment_like';` |
| Verify `.env.local` not committed | `git check-ignore -v .env.local` (already confirmed gitignored) |

### Postgres

```sql
-- 1. Slow / frequent queries
create extension if not exists pg_stat_statements;
select calls, round(total_exec_time::numeric, 2) as total_ms,
       round(mean_exec_time::numeric, 2) as mean_ms, query
from pg_stat_statements
order by total_exec_time desc limit 20;

-- 2. EXPLAIN ANALYZE the gallery and tag-filter queries
explain (analyze, buffers)
select id, slug, created_at from images
where is_published = true
order by created_at desc, id desc limit 25;

-- 3. Stats freshness
select relname, last_vacuum, last_autovacuum, n_live_tup, n_dead_tup
from pg_stat_user_tables where schemaname = 'public'
order by n_dead_tup desc;

-- 4. Detect missing FK indexes (production reality check)
select conrelid::regclass as table_name, a.attname as fk_column
from pg_constraint c
join pg_attribute a on a.attrelid = c.conrelid and a.attnum = any(c.conkey)
where c.contype = 'f' and not exists (
  select 1 from pg_index i
  where i.indrelid = c.conrelid and a.attnum = any(i.indkey)
);
```

### Shadcn

| Check | Command |
|---|---|
| Live installed-components list, isRSC, resolvedPaths | `npx shadcn@latest info --json` |
| Resolved preset (theme/font tokens) | `npx shadcn@latest preset resolve --json` |
| Preview adding a component | `npx shadcn@latest add field --dry-run` |

---

## Suggested follow-up roadmap

A pragmatic order to actually fix this (each step verifies before moving on):

### Phase 1 — Security must-fix (do today)

1. **Drop `anon can update like_counts` policy** (C1). New migration: `revoke update on like_counts from anon;` + drop the policy. Verify with `curl -X PATCH .../rest/v1/like_counts?image_id=eq...` returns `401`/`42501`.
2. **Add admin role check** (H1). Set `app_metadata.role = 'admin'` on your admin user via SQL, then update `requireAdminSession` to verify it.
3. **Run `supabase db advisors`** and address Critical/Warning findings.

### Phase 2 — User-facing bugs (do this week)

4. **Mount `<Toaster />`** (H3) — one-line change in `app/layout.tsx`.
5. **Install `field` + refactor login + upload forms** (H4–H6).
6. **Replace `space-y-*` with `flex flex-col gap-*`** (H8–H10).
7. **Fix tag-filter query shape + add cursor** (H2 + M-P7).

### Phase 3 — Performance and code health (do this month)

8. Add non-partial admin index `images_created_all_idx` (M-P3).
9. Switch dashboard aggregations to SQL (M-P9).
10. Batch tag upsert + remove select-then-insert race (M-P8).
11. Add `is_published_image()` helper for `image_tags` RLS (M-P5).
12. Use anon client in maintenance-mode middleware + single-flight (M-S3) + use anon on homepage (M-S5).
13. Add DB CHECK constraints (M-P2).
14. Address remaining shadcn rules: `data-icon` on button icons, `Empty` component for empty states, `FieldSet` for grouped controls, `Spinner` for loading buttons.

### Phase 4 — Polish (when convenient)

15. Register `--color-success` in `@theme inline` (L-Sh1).
16. Accept new publishable key name in `lib/config.ts` (L-S1).
17. Delete dead `utils/supabase/middleware.ts` (L-S4).
18. Drop `anon can read settings` / `like_events` if not needed client-side (L-S2, M-S4).
19. Reconsider what `/api/health` returns to anonymous callers (L-S3).
20. Plan UUIDv7 migration if write volume grows (M-P1) and BRIN on `like_events.created_at` (L-P1).

---

*Generated by skills audit per [`.cursor/plans/skills_audit_report_fb041657.plan.md`](../.cursor/plans/skills_audit_report_fb041657.plan.md). Re-run by asking: "re-run the skills audit".*
