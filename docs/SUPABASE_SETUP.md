# Supabase setup

HomeScope stores all household data in a single Supabase project (Postgres +
Auth). This doc covers environment variables, migrations, the email-OTP
auth flow, the Data API / RLS security model, and troubleshooting.

## Environment variables

Set these in `.env.local` for local development and in your hosting
provider's environment settings for deployed environments. Names only —
never commit real values other than the placeholders in `.env.example`.

- `NEXT_PUBLIC_SUPABASE_URL` — the project's API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` — the public, browser-safe key
  (Supabase's newer `sb_publishable_...` key format; the old naming for the
  equivalent key was `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

Both variables are safe to expose to the browser. **Never** add a
`service_role` / `sb_secret_...` key to any `NEXT_PUBLIC_*` variable or
otherwise ship it to client code — this app has no server-side code path
that needs it, and none should be added.

## Local setup

1. `cp .env.example .env.local` and fill in your project's URL and
   publishable key (Dashboard → Settings → API).
2. `npm install`
3. Apply the database migrations (see below) to your Supabase project.
4. `npm run dev`

## Database migrations

Migrations live in `supabase/migrations/` and are applied in order:

- `0001_schema.sql` — all tables, indexes, and the `updatedAt` trigger.
- `0002_functions.sql` — `is_household_member()`, `bootstrap_household()`,
  and `import_household_backup()`.
- `0003_policies.sql` — Row Level Security policies for every table.
- `0004_data_api_grants.sql` — explicit Postgres `GRANT`s for the Data API.
  **Required even though RLS is enabled** — see "Data API access" below for
  why this is a separate layer.

Apply them with the Supabase CLI:

```bash
npx supabase link --project-ref <your-project-ref>
npx supabase db push --dry-run   # review what would change
npx supabase db push             # apply
```

Check what's applied on the remote project at any time with:

```bash
npx supabase migration list
```

New migrations should be additive (new `CREATE`/`ALTER`/`GRANT` statements).
Avoid `DROP TABLE`, `TRUNCATE`, or anything that discards existing household
data.

## Authentication

HomeScope uses Supabase email OTP, not a magic-link-only flow. The UI at
`/login` (`src/app/login/page.tsx`) is a two-step form:

1. **Email step** — calls `supabase.auth.signInWithOtp({ email, options: { shouldCreateUser: true, emailRedirectTo } })`.
   This sends one email containing both a numeric code and a clickable link.
2. **Code step** — calls `supabase.auth.verifyOtp({ email, token, type: "email" })`
   with what the user typed. On success, a session cookie is set and the app
   redirects into `(app)`.

If someone clicks the emailed link instead of typing the code, it lands on
`/auth/callback` (`src/app/auth/callback/route.ts`), which exchanges the PKCE
`code` param for a session via `supabase.auth.exchangeCodeForSession()` —
both paths converge on the same authenticated session.

`src/middleware.ts` / `src/lib/supabase/middleware.ts` refresh the session
cookie on every request and redirect unauthenticated requests to `/login`
(except `/login` and `/auth/callback` themselves).

Once a session exists, `HouseholdProvider` (`src/lib/household/context.tsx`)
runs once per sign-in:

1. Confirms the session (`supabase.auth.getUser()`).
2. Calls the `bootstrap_household()` RPC, which returns the caller's
   household id — creating one, or joining one via a pending invite, if
   they don't have one yet.
3. Checks whether that household has an `appSettings` row; if not, seeds
   starter content (`src/lib/seed/cloud.ts`).
4. Publishes the household id (`setCurrentHouseholdId`) so the rest of the
   app can load household-scoped data.

No household-scoped query runs before this sequence completes.

### Email OTP configuration (manual Dashboard step)

Supabase's default "Magic Link" email template only includes
`{{ .ConfirmationURL }}`, so out of the box the email says "Your sign-in
link" with no visible code — even though `verifyOtp` and the code-entry UI
both work once a code is actually in the email. To make the email show the
code, edit the template:

**Dashboard → Authentication → Email Templates → Magic Link**

Add `{{ .Token }}` to the body. Minimal recommended template:

```html
<h2>Your HomeScope verification code</h2>

<p>Enter this code in HomeScope:</p>

<p style="font-size: 28px; font-weight: 600;">
  {{ .Token }}
</p>

<p>Or use the link below on this device:</p>
<p><a href="{{ .ConfirmationURL }}">Sign in to HomeScope</a></p>

<p>This code expires shortly.</p>
```

This is a Supabase project setting, not application code — it can't be
applied from this repo.

## Data API access

Supabase's Data API (PostgREST, what `supabase-js` talks to) requires two
independent layers of authorization for every table:

1. **Postgres `GRANT`s** — does the requesting role (`anon` or
   `authenticated`) have privileges on the table at all? Checked first, at
   the Postgres level, before any policy is evaluated.
2. **Row Level Security policies** — of the rows the role could see, which
   ones actually match this request?

A table can have RLS enabled and correct policies and still return
`403 (42501, permission denied)` for every request if it has no `GRANT`.
Older Supabase projects had a blanket `alter default privileges` rule that
granted CRUD to `anon`/`authenticated`/`service_role` on every new table
automatically, which made this invisible. Newer projects don't have that
default, so grants must be explicit — that's what `0004_data_api_grants.sql`
does.

The model here: `anon` gets no household-table grants at all (this app has
no public data; the anon key is only used to call the Auth API, which is
GoTrue, not PostgREST). `authenticated` gets exactly the CRUD it needs per
table. `service_role` is granted for parity with a standard Supabase
project, even though the app never ships that key to the browser or calls
it from anywhere.

## RLS authorization model

Every household-owned table has this chain, enforced by the
`is_household_member()` helper (`SECURITY DEFINER`, so it can read
`household_members` without recursing into that table's own RLS):

```
auth.uid()  →  household_members.user_id  →  household_members.household_id  →  record."householdId"
```

All policies are scoped `to authenticated` explicitly (not the `public`
default). A signed-in user sending a request with someone else's
`householdId` gets zero rows back — the policy's `USING`/`WITH CHECK`
clause re-derives membership from `auth.uid()` server-side; the client's
claimed `householdId` is never trusted on its own. Frontend filtering is
not a security boundary here — RLS is.

`bootstrap_household()` and `import_household_backup()` are the only ways
new households/memberships are created — never a direct client `INSERT` —
so `households` and `household_members` have no insert/delete grants or
policies for ordinary CRUD. Both functions are `SECURITY DEFINER` with a
pinned `search_path`, derive identity only from `auth.uid()` (never a
client-supplied user id), and are granted `EXECUTE` to `authenticated` only.

## Troubleshooting

### 403 / 42501 ("permission denied for table ...")

Missing `GRANT`. RLS being enabled does not imply the Data API can reach
the table — see "Data API access" above. Fix by adding the table to a
`GRANT select, insert, update, delete on <table> to authenticated;`
migration (see `0004_data_api_grants.sql` for the pattern), then
`npx supabase db push`.

### Request succeeds but returns no rows / RLS violation on write

The `GRANT` is fine but the policy's membership check is failing — usually
because the caller isn't actually a member of the household id they're
using, or `bootstrap_household()` hasn't run yet for this session. Confirm
with the read-only queries below.

### UI says "enter code" but the email only shows a link

The Magic Link email template needs `{{ .Token }}` added — see "Email OTP
configuration" above. This is a Dashboard setting, not a code bug.

### Hydration warning mentioning `data-new-gr-c-s-check-loaded` / `data-gr-ext-installed`

These are attributes injected into `<body>` by the Grammarly browser
extension after the server response is sent, not by HomeScope. Confirm by
reloading in an Incognito window / with extensions disabled — if the
warning disappears, no application change is needed. Test this before
changing any application code.

## Read-only verification queries

Run these in the Supabase SQL Editor to inspect the current configuration
without changing anything.

```sql
-- Table-level grants for anon/authenticated across all public tables
select table_name, grantee, privilege_type
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
order by table_name, grantee, privilege_type;

-- Which tables have RLS enabled
select relname as table_name, relrowsecurity as rls_enabled
from pg_class
where relnamespace = 'public'::regnamespace
  and relkind = 'r'
order by relname;

-- All policies and which roles they apply to
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- Function security mode and search_path for the RPCs the app calls
select p.proname, p.prosecdef as security_definer, p.proconfig
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('is_household_member', 'bootstrap_household', 'import_household_backup');
```
