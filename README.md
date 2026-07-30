# HomeScope

A private, **step-by-step home-buying guide** for two people buying a home in New Jersey, leading from July 2026 through a May–June 2027 closing. It is a calm digital companion — not a marketplace, lender, or advice platform.

The **Journey** is the organizing structure of the app. At every step it helps answer:

1. Where are we in the process?
2. What should we do next, and why does it matter?
3. What information or decision is required, and who is responsible?
4. Which resources and which app tool support this step?
5. What mistakes should we avoid, and are we ready to proceed?

Property tracking, financial scenarios, lender quotes, professional contacts, town research, documents, and decisions all connect to the relevant stage of the journey. Every figure is an **estimate for personal planning** — not financial, legal, or tax advice.

---

## The guided journey

Eighteen editable stages, from strategy to closing. Each is defined as versioned TypeScript content (`src/lib/guide`), separate from the household's stored progress, so guide wording can be revised without losing state:

1. Define our home-buying strategy · 2. Prepare our finances · 3. Prepare for the attending-income transition · 4. Learn mortgage options · 5. Interview lenders · 6. Obtain preapproval · 7. Find & interview buyer's agents · 8. Build the professional team · 9. Research towns & schools · 10. Begin the active search · 11. Tour & evaluate properties · 12. Prepare an offer · 13. Negotiation · 14. Attorney review · 15. Inspections & due diligence · 16. Finalize financing · 17. Prepare for closing · 18. Closing & post-closing.

Every guided step page follows the same shape: **what it accomplishes · why it matters for us** (personalized from the household profile) **· actions · decisions · questions to ask · documents · resources · mistakes to avoid · completion criteria · related tools.**

## Navigation

- **Journey** *(`/journey`, the signed-in landing page)* — current stage, weighted overall progress, target closing window, next recommended actions, blocking items, decisions awaiting input, recently completed milestones, five readiness meters (financial, mortgage, team, search, offer), and the full 18-stage roadmap. The former dashboard's key figures live here. (`/`, the site root, is the logged-out public welcome page — see "Public entry & sign-in" below.)
- **Properties** — add / edit / archive / restore / delete, per-property cost estimates, guardrail banding, missing-info flags, a printable report, and a per-property **deal** covering stages 12–18 (offer readiness, negotiation log, attorney review, inspections, financing, closing prep, post-closing) with a prominent private **walk-away price**.
- **Compare** — 2–5 properties side by side; most-favorable cell marked per row (never an automatic winner).
- **Finances** — a transparent mortgage & cash planner with named, duplicable scenarios.
- **Lenders** — a quote tracker plus a separate **approvals** tab that distinguishes readiness conversation → prequalification → formal preapproval → fully underwritten. Never ranked by rate alone.
- **Professionals** — a role-based directory with interview banks, agent licence/experience verification, an agent scorecard, and a deliberate select-one-per-role workflow.
- **Timeline** — the plan and reusable checklists, plus a **documents index** (records that a document exists and where it lives; no files are stored).
- **Resources** — a curated library of primary-source links (federal, NJ, regulator, then established organizations), each with our own summary, a "report outdated" action, and a restore-curated-set option.
- **Settings** — household members and family invitations, the household planning profile that personalizes the whole guide, plus data & backups and account sign-out.
- **Notes** *(`/notes`)* — a small, freeform notes feature shared by both HomeScope paths (buyer and homeowner alike), for anything that doesn't belong to a more specific tool.

The nav above is buyer mode. Homeowner mode (`activeMode = "owning"`, see **`docs/WORKSPACE_MODE.md`**) sees **HomeBase** (`/homebase`, its landing page) and **Maintenance** (`/maintenance`, a placeholder today — real maintenance tracking is a future PR) instead of Journey/Properties/Toolkit — the buyer-only tools (Compare, Finances, Lenders, Professionals, Resources, Timeline, and the Toolkit hub bundling them) stay buyer-only, since their content is pre-purchase specific. `src/lib/workspace/navigation.ts` is the single source of truth for which destinations exist per mode, the default landing route per mode, and route access protection (a buyer opening a homeowner-only URL, or vice versa, is redirected rather than shown the wrong experience).

## Public entry & sign-in

- **`/`** — the public welcome page (`src/components/marketing/`). Shown only to logged-out visitors; an authenticated visitor is redirected server-side to `/journey`. No buyer/homeowner choice, no app navigation, no account data — just a calm introduction with **Log in** and **Get started**.
- **`/get-started`** — also public. Reuses PR 2's `PathSelectionCards` unmodified (no second copy of that UI) to let a new visitor pick buyer/homeowner *before* signing in. The choice is stored client-side only (`lib/workspace/provisional-path.ts`, the same narrow localStorage convention as the theme preference) and read back by `WorkspaceGate` after sign-in to pre-select the same step in the real (PR 2) onboarding flow, instead of asking twice. It is a UI hint only — the workspace row in Supabase remains the sole source of truth for the actual mode.
- **`/login`** — unchanged. One Supabase email-OTP form that already serves as both sign-in *and* sign-up (`shouldCreateUser: true`); there is no separate password-based registration and, by design, no "this email already exists" signal for OTP auth (Supabase intentionally answers new and existing emails identically to prevent account enumeration).
- Both `/` and `/get-started` are listed in `middleware.ts`'s public paths — each page resolves the session itself (via the Supabase **server** client) and redirects an authenticated visitor into the app, rather than middleware special-casing them.

## Personalized next-action engine

A deterministic, rules-based engine (no AI) reads the household snapshot and surfaces recommendations — critical, warning, or suggestion. Each states **why it appeared, which stored information triggered it, and what would clear it** — never an opaque score. Examples: an offer exceeding the walk-away price, attending income relied upon without written lender confirmation, touring without a preapproval, or a shortlisted home missing verified taxes/schools/commute.

Progress is **weighted**, not a raw task count: signing an attending contract counts far more than reading a resource. Readiness is described in words ("Lender interviews started; attending-contract eligibility not confirmed"), never a blunt single percentage.

## Explicit non-goals

This app deliberately does **not** include: a chatbot or any LLM/AI features, RAG, vector databases, Zillow/MLS scraping, live real-estate or rate APIs, bank-account connections, document OCR/extraction, file uploads, a native mobile app, microservices, background workers, analytics/telemetry, or decorative charts. It is not a blog, course, or encyclopedia. It never shows a blunt "you can afford this" verdict, never blocks saving a property that exceeds a limit, and never claims to replace a lender, attorney, tax professional, inspector, insurance professional, or real-estate agent.

---

## Architecture

- **Next.js 15** (App Router, TypeScript, strict mode)
- **Supabase** — Postgres with Row Level Security, Auth (email OTP), via `@supabase/supabase-js` / `@supabase/ssr`
- **Vercel** — hosting, Preview Deployments (per PR/branch) and Production Deployment (on merge to `main`), custom domain
- **GitHub Actions** — CI quality gate (lint, typecheck, test, build) on every PR and on `main`

```
Browser / PWA
      ↓
Next.js (App Router)
      ↓
Supabase Auth (email OTP)  +  Postgres (Row Level Security)

GitHub                              Vercel
  main branch                         │
  feature/*, fix/*, chore/* branches  │
      ↓                               │
  Pull Request → main                 │
      ↓                               │
  GitHub Actions ("HomeScope CI")     │
  lint · typecheck · test · build     │
      ↓                               ↓
  you review + merge     ──────►  Preview Deployment (per PR, for manual testing)
                                   Production Deployment (on merge to main)
                                       ↓
                          https://home.nitinkotcherlakota.com
```

GitHub Actions **never deploys** — Vercel's own Git integration owns Preview and Production deployments, triggered directly by pushes/PRs, independent of the CI workflow's outcome. CI is a review aid, not a deployment gate in the infrastructure sense (though branch protection can make it one for merging — see "GitHub Actions" below).

## Production environment

**Production URL:** `https://home.nitinkotcherlakota.com`

- `main` branch = production. Every merge to `main` triggers a new Vercel Production Deployment.
- Feature branches and their Pull Requests each get their own Vercel **Preview Deployment** — a real, running copy of the app on a unique URL, used for manual testing before merge.
- **Vercel** is the deployment platform for both environments (see "Vercel preview deployments" below).
- **Supabase** is the persistent application database and auth provider for both local dev and production — there is a single Supabase project; there is no separate "staging" database (see "Database change workflow" for why this makes migration discipline important).

---

## Local development

```bash
git clone <this repository>
cd HomeBase
npm ci
cp .env.example .env.local   # fill in your Supabase project URL + publishable key
npm run dev                  # http://localhost:3000
```

You'll be redirected to `/login` until you sign in (email code or magic link). Signing in only proves *who you are* — it doesn't by itself grant access to any household's data. The first time you sign in with no household yet, you'll see a **Welcome to HomeScope** screen: **Create a household** (seeds a blank planning profile, three clearly-marked **SAMPLE** properties, the timeline, and the reusable checklists) or **Join a household** (enter an invitation code from an existing member — see "Household membership & family invites" below).

Required environment variables (see "Environment variables" for the full table — no values shown here, only names):

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

If you don't yet have a Supabase project to point at, see `docs/SUPABASE_SETUP.md` for one-time project setup (creating the project, running the four migrations, enabling email auth, setting Site URL / Redirect URLs).

### Commands

```bash
npm run dev         # start the dev server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint (via `next lint`)
npm run typecheck   # tsc --noEmit
npm test            # Vitest — unit + legacy-persistence integration (run once)
npm run test:watch  # Vitest in watch mode
```

**Node version:** the project has no `.nvmrc`/`engines` pin; local development and CI both use **Node 22** (the current Node LTS line, compatible with Next.js 15's `^18.18 || >=20` requirement). If you change this, update `.github/workflows/ci.yml` and check Vercel's Project Settings → Node.js Version stays aligned.

---

## Normal code change workflow

```bash
git checkout main
git pull
git checkout -b feature/descriptive-name
```

Make your change, then validate locally with the project's real commands:

```bash
npm run lint
npm run typecheck
npm test
npm run build
```

Then:

```bash
git add .
git commit -m "..."
git push -u origin feature/descriptive-name
```

1. Open a Pull Request to `main`.
2. GitHub Actions ("HomeScope CI") runs automatically.
3. Wait until CI passes.
4. Open the Vercel **Preview Deployment** URL (posted on the PR by Vercel's GitHub integration).
5. Test the feature.
6. If the change affects layout/responsive behavior, check it on mobile and iPad-sized viewports too (see the design constraints in "Known limitations" and the project's UI conventions).
7. Merge the PR.
8. Vercel deploys `main` to production automatically.
9. Verify production at `https://home.nitinkotcherlakota.com`.

## Database change workflow

**This section is especially important — the production database is shared; there is no separate staging database.**

A change is a *database change* if it touches, directly or via a migration file, any of: a new/changed field, a new table, RLS policies, indexes, constraints, foreign keys, Postgres functions/triggers, or Data API grants. Application code that reads/writes a new column always needs an accompanying migration — the two must land in the same PR.

Migrations live in `supabase/migrations/`, applied in order (`0001_schema.sql` → `0002_functions.sql` → `0003_policies.sql` → `0004_data_api_grants.sql` → `0005_household_v2_schema.sql` → `0006_household_v2_functions.sql` → `0007_household_v2_policies.sql` → `0008_household_v2_grants.sql` → the `0009`–`0011` invite-code fixes → `0012_workspace_mode_schema.sql` → `0013_workspace_mode_policies.sql` → `0014_workspace_mode_grants.sql` → `0015_notes_schema.sql` → `0016_notes_policies.sql` → `0017_notes_grants.sql` → `0018_notes_backup_function.sql` (extends `import_household_backup()` to cover the new `notes` table), plus any new ones you add after). Full detail on what each one does and the Data API grant/RLS model lives in **`docs/SUPABASE_SETUP.md`**; the buyer/homeowner **workspace mode** foundation (why mode is stored at the workspace level) lives in **`docs/WORKSPACE_MODE.md`**. This section covers the *process*, not the schema.

1. Create a feature branch.
2. Implement the application code change.
3. Write a new migration file under `supabase/migrations/` (additive — new `CREATE`/`ALTER`/`GRANT` statements; see "Critical database safety rules" below).
4. Test locally: point `.env.local` at a project you can safely experiment against, or review the SQL carefully by reading.
5. Open the PR.
6. Let CI run. CI **detects** the migration and posts a notice in the workflow's Job Summary — it does not apply anything and does not fail the build because a migration exists.
7. **Review the migration SQL carefully** — read every statement, don't skim.
8. Before touching production, dry-run it:
   ```bash
   npx supabase link --project-ref <your-project-ref>   # one-time per machine
   npx supabase db push --dry-run
   ```
9. Inspect exactly what the dry-run says it will change. If anything is unexpected, stop (see "Troubleshooting").
10. Only after you've manually approved it, apply it:
    ```bash
    npx supabase db push
    ```
11. Verify schema/RLS/data behavior — e.g. re-run the read-only verification queries in `docs/SUPABASE_SETUP.md`, or test the affected feature against this Supabase project.
12. Merge the PR.
13. Vercel deploys the application code change to production.
14. Verify production end-to-end (the app code and the database are now both updated).

**No automated step ever runs `supabase db push` against production.** GitHub Actions cannot reach your production database — there is no database credential in CI at all.

## Critical database safety rules

**DO NOT:**

- Delete production tables or columns casually.
- Disable RLS "to fix permissions" — fix the policy or the grant instead (see `docs/SUPABASE_SETUP.md` → "Data API access" for the two-layer grant + RLS model, and its 403/permission-denied troubleshooting entry).
- Broadly grant table access to `anon` as a shortcut.
- Run destructive migration SQL (`DROP TABLE`, `TRUNCATE`, unscoped `DELETE`, `ALTER COLUMN TYPE`, `CASCADE`) without explicitly reasoning through what data it affects first.
- Put a `service_role` key into frontend code, `NEXT_PUBLIC_*`, or anywhere in this repository — the app has no code path that needs it, and none should be added.
- Put a database password into `NEXT_PUBLIC_*` or any client-reachable variable.
- Modify production schema directly through the Supabase Dashboard's table editor without also creating the equivalent migration file — the migration files are the source of truth; a dashboard-only change means the next `db push` from a clean checkout won't reproduce it.
- Automatically apply production migrations from CI, ever.
- Edit a migration file that has already been applied to production. Once applied, treat it as immutable — write a new, corrective migration instead (see "Rollbacks" below).

Migrations are part of source control: the sequence of files in `supabase/migrations/` is the one accurate history of the schema. Anyone reconstructing the database from scratch should be able to run them in order and get the current schema.

## RLS / authorization

(Inspected from the actual policies in `supabase/migrations/0003_policies.sql` and functions in `0002_functions.sql` — see `docs/SUPABASE_SETUP.md` for the full model, including the Data API grant layer and read-only SQL you can run to verify the live configuration.)

Every household-owned table is scoped through a `is_household_member()` helper (`SECURITY DEFINER`), enforcing:

```
auth.uid()  →  household_members.user_id  →  household_members.household_id  →  record."householdId"
```

All policies are scoped `to authenticated` explicitly. A signed-in user's claimed `householdId` is never trusted on its own — the policy re-derives membership from `auth.uid()` server-side on every request. `households` and `household_members` have no direct insert/delete policies at all: new households and memberships are only ever created through `bootstrap_household()` / `import_household_backup()` (`SECURITY DEFINER`, pinned `search_path`, identity derived only from `auth.uid()`).

**To safely add a new household-owned table:** add it to `0001_schema.sql`-style migration with a `"householdId"` column referencing `households(id)`, then add matching `enable row level security` + four policies (select/insert/update/delete, all gated on `is_household_member("householdId")`) in a new migration alongside the equivalent `GRANT ... to authenticated` — see `0003_policies.sql` and `0004_data_api_grants.sql` for the exact pattern to copy. A new table isn't done until both layers exist; RLS alone still returns `403` without the grant.

## Household membership & family invites

Authentication (Supabase Auth — "who are you?") and household authorization ("what can you see?") are deliberately separate. A signed-in user with no household membership sees the **Welcome to HomeScope** onboarding screen, never another household's data and never an implicitly-created empty one.

- **`bootstrap_household()`** (called once per sign-in by `HouseholdProvider`) resolves the caller's *active* household from `user_preferences.active_household_id` (falling back to their sole membership, or their most-recently-joined one if they somehow have several) and returns it — or `null` if they have none. It never creates a household as a side effect.
- **Create a household** (`create_household()`) — explicit, onboarding-only. The caller becomes its `owner`.
- **Invite a family member** (Settings → Household members → *Invite family member*, calling `generate_family_invite()`) — generates a 16-character code (`K7FD-M9QX-4R2P` style, ~80 bits of entropy, unambiguous alphabet), shows it **once**, and stores only its SHA-256 hash. Expires in 24 hours, usable once. Any existing member can invite (not owner-only — see the migration's comment on why) and revoke a still-pending invite.
- **Join a household** (`redeem_family_invite(code)`) — atomic, race-safe (a second simultaneous redemption attempt simply fails), sets `role = 'member'`, and switches the caller's active household to the one just joined. Invalid, expired, revoked, and already-used codes all fail with the same generic message.
- **`list_household_members()`** is the one place the app reads another member's email — a `SECURITY DEFINER` function scoped strictly to the caller's own active household; `auth.users` is never exposed to the client directly.

None of this is in the JSON backup/export — membership and invitations are security metadata, not household content.

### Repairing an account stuck on the wrong household

If someone signed in before an invite existed for them, `bootstrap_household()`'s old behavior (since replaced) would have created them their own empty household. To fix it without losing anything:

1. Confirm the account with the real data still sees it after signing in.
2. That account → **Settings → Household members → Invite family member** → copy the code.
3. The other account signs in with their existing Supabase login, sees the onboarding screen (their old accidental household is untouched, just no longer selected) → **Join a household** → enters the code.
4. Their active household switches to the real one; the real data appears immediately.
5. Each account makes one harmless test edit and confirms the other sees it after a refocus/reload.
6. The old accidental household is left alone — deciding whether/how to clean it up later is a separate, deliberate action, never automatic.

## Environment variables

| Variable | Required locally? | Required in Vercel? | Public or secret? | Purpose |
|---|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes, in `.env.local` | Yes, for Production **and** Preview | Public | Supabase project API URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes, in `.env.local` | Yes, for Production **and** Preview | Public | Supabase anon/publishable key — access is gated by RLS, not by keeping this value secret |
| `PREVIEW_GATE_ENABLED` | No (defaults to disabled) | Only while the temporary preview gate is in use | Secret-adjacent* | Turns the site-wide preview access gate on/off — see "Preview access gate" below |
| `PREVIEW_ACCESS_KEY` | Only if `PREVIEW_GATE_ENABLED=true` | Only while the gate is in use | **Secret** | The shared key visitors must enter at `/preview-access` |
| `PREVIEW_COOKIE_SECRET` | Only if `PREVIEW_GATE_ENABLED=true` | Only while the gate is in use | **Secret** | Signs the preview-authorization cookie; separate from the access key so rotating one doesn't require rotating the other |

\* `PREVIEW_GATE_ENABLED` isn't sensitive on its own, but keep it alongside the two secrets since it controls whether they're enforced.

Aside from the temporary preview gate, the app has no other environment variables, no server-only secrets besides the two above, and no code path that reads a Supabase `service_role` key.

- **`.env.local`** → local development only, git-ignored, never committed.
- **Vercel Environment Variables** (Project Settings → Environment Variables) → what Production and Preview deployments actually run with. Set both variables for both environments.
- **GitHub Secrets/Variables** → only relevant to CI. **None are currently required** — `npm run build` succeeds with these variables entirely unset (verified: no page calls Supabase during static generation), so `.github/workflows/ci.yml` hardcodes harmless non-functional placeholder values directly in the workflow rather than reading any secret. If a future change makes the build depend on a real value, add it as a GitHub Actions **repository Variable** (`vars.*`), not a Secret — these values are public by design.

Any variable prefixed `NEXT_PUBLIC_` is bundled into client-side JavaScript and downloaded by every visitor's browser. Never add a secret under that prefix.

## Preview access gate

A **temporary, site-wide gate** for use before public launch: while enabled, every visitor must enter a shared preview access key at `/preview-access` before reaching *any* part of the app — the public welcome page, `/login`, `/get-started`, and every authenticated route. It's an outer layer only; it does not replace Supabase Auth, RLS, or household authorization, all of which continue to run normally once a visitor is past the gate. Implementation: `src/lib/preview-gate/` (config, signed-token, rate-limit, return-to sanitization, and the gate check itself) plus `src/app/preview-access/` (the page, its form, and the server action that validates the key); wired into `src/middleware.ts` ahead of the existing Supabase session logic.

**1. Enable it locally**

```bash
# .env.local
PREVIEW_GATE_ENABLED=true
PREVIEW_ACCESS_KEY=some-long-random-value       # e.g. `openssl rand -hex 32`
PREVIEW_COOKIE_SECRET=a-different-long-random-value
```

Restart `npm run dev`. Every route now redirects to `/preview-access` until you enter `PREVIEW_ACCESS_KEY`. Leave `PREVIEW_GATE_ENABLED` unset (or `false`) for normal local development — this is the default, so cloning the repo and following "Local development" above is unaffected.

**2. Required environment variables** — see the table above. All three (`PREVIEW_GATE_ENABLED`, `PREVIEW_ACCESS_KEY`, `PREVIEW_COOKIE_SECRET`) are server-only; none is ever prefixed `NEXT_PUBLIC_`, sent to the browser, or logged. If the gate is enabled but either secret is missing, the app **fails closed** — every route except `/preview-access` itself returns a generic 503 rather than silently letting traffic through.

**3. Configure in Vercel** — Project Settings → Environment Variables. Add all three for whichever environments should be gated (typically Production, and Preview too if preview deployments should also stay private). Changing any of them requires a new deployment to take effect, the same as every other environment variable in this app (see "Vercel preview deployments" below).

**4. Rotate the shared key** — update `PREVIEW_ACCESS_KEY` in Vercel and redeploy. Existing visitors keep their access (the cookie only proves the key was verified at some point, it doesn't embed the key), so this alone does **not** revoke already-authorized browsers — see the next item for that.

**5. Invalidate existing preview cookies** — either:
   - rotate `PREVIEW_COOKIE_SECRET` in Vercel and redeploy (every previously issued cookie fails signature verification), or
   - bump `PREVIEW_TOKEN_VERSION` in `src/lib/preview-gate/cookie.ts` (a code change) and deploy — every previously issued cookie fails the version check.

**6. Disable before public launch** — set `PREVIEW_GATE_ENABLED=false` (or remove it) in Vercel and redeploy. No code deletion or route changes needed: the gate becomes a clean pass-through, `/` shows the normal public welcome page, and `/preview-access` itself redirects to `/`.

**Known limitation:** the key-validation rate limiter (`src/lib/preview-gate/rate-limit.ts`) is an in-memory, per-instance counter — intentionally not backed by Redis/Upstash for a temporary, low-traffic gate. It still meaningfully slows down guessing on a single warm instance, but a high-traffic attacker spread across many cold serverless instances would get a looser effective limit than the configured threshold suggests.

## Supabase Auth configuration changes

Some authentication configuration lives in the Supabase Dashboard, not in this Git repository, and changing it does **not** require (or trigger) a Vercel deployment unless application code also changes:

- **Site URL** and **Redirect URLs** (Dashboard → Authentication → URL Configuration). Production Site URL should be `https://home.nitinkotcherlakota.com`; Redirect URLs must include `https://home.nitinkotcherlakota.com/auth/callback` and `http://localhost:3000/auth/callback` for local dev (see "Vercel preview deployments" below for the Preview-URL caveat).
- **Email templates** — Supabase uses **two separate templates** for `signInWithOtp`, and both need `{{ .Token }}` added, or you'll see inconsistent emails depending on whether the recipient is a brand-new or returning `auth.users` row: **Magic Link** (existing users) and **Confirm signup** (a person's very first sign-in, when `shouldCreateUser` creates their account). See `docs/SUPABASE_SETUP.md` → "Email OTP configuration" for the exact template for both.
- **SMTP configuration / OTP settings.**

The application's own callback route (`src/app/auth/callback/route.ts`) always redirects relative to the request's own origin — it has no hardcoded host — so it works unmodified in local dev, Preview, and Production; only the Supabase-side Redirect URL allow-list needs to know about each host.

## Email

Authentication email delivery uses a custom sending domain, **`auth.nitinkotcherlakota.com`**, configured as Supabase's SMTP provider. That configuration (API keys, SMTP credentials, DNS records) is managed entirely outside this repository, in the Supabase Dashboard and the email provider's own console — nothing about it lives in this codebase, and no API key or SMTP password should ever be added here.

## Vercel preview deployments

- Any feature branch with an open Pull Request gets a Preview Deployment — a real, independently-running instance of the app on its own generated URL.
- `main` gets the Production Deployment at `https://home.nitinkotcherlakota.com`.
- Use the Preview URL for the manual testing step in "Normal code change workflow" above, before merging.
- **Limitation (inspected, not assumed):** the app's numeric-code sign-in works unmodified on any Preview URL, since `verifyOtp` doesn't depend on a redirect at all. The **clickable magic-link** in the OTP email, however, only redirects successfully if the Preview URL matches an entry in Supabase's Redirect URLs allow-list — and Vercel generates a new unique URL per deployment. If you want the clickable link (not just the typed code) to work on Preview deployments, add a wildcard entry for your Vercel preview URL pattern to Supabase's Redirect URLs (Supabase supports wildcard matching there) — otherwise just use the code-entry path when testing on Preview.

## GitHub Actions

Workflow: **`.github/workflows/ci.yml`** ("HomeScope CI"). Triggers on every Pull Request targeting `main`, and on every push to `main` (as a post-merge sanity check).

It runs, in order, using the project's real `npm` scripts:

1. Checkout (full history, for the migration-diff step)
2. Node 22 setup with npm dependency caching
3. `npm ci`
4. `npm run lint`
5. `npm run typecheck`
6. `npm test`
7. `npm run build`
8. On PRs only: a non-blocking check for changed files under `supabase/migrations/**`, surfaced as a notice in the workflow's Job Summary (see "Database change workflow") — it never fails CI and never applies anything.

If lint, typecheck, tests, or the build fail, the workflow fails and shows a red ✗ on the PR — that's the point of "make failures obvious." **CI never deploys anything and never touches Supabase.** Vercel's own Git integration handles Preview/Production deployment independently of this workflow's pass/fail state.

### Recommended branch protection for `main`

(Not applied automatically — GitHub repository settings require explicit action; this documents the recommendation for you to apply in Settings → Branches.)

- Require a pull request before merging.
- Require status checks to pass before merging, with **`HomeScope CI / Lint, typecheck, test, build`** as the required check (the exact context GitHub reports — it only becomes selectable in the branch protection UI after the workflow has run at least once on a PR).
- Require branches to be up to date before merging (optional, but keeps CI honest).
- Block force pushes to `main`.
- Skip anything requiring multiple/enterprise-style approvals — unnecessary for a personal project.

## Branching strategy

- `main` → production, always deployable.
- `feature/*`, `fix/*`, `chore/*` → all development work, short-lived, merged via PR.

No `develop` or `release` branches — kept intentionally simple for a personal project.

## Rollbacks

**Application code:** either (a) revert the offending commit/PR on `main` and push the revert (which triggers a normal new Production Deployment), or (b) use Vercel's own rollback/promote-a-previous-deployment mechanism from the Vercel dashboard for that project — consult Vercel's current UI/docs, since exact locations there can change independently of this repo.

**Database migrations are different — an application rollback never rolls back a database migration.** If a migration causes a problem in production:

- Do not edit or delete the already-applied migration file.
- Write a new, explicit corrective migration (e.g. re-adding a dropped column, reversing a `GRANT`) and run it through the same review → dry-run → manual-apply process above.
- Prefer backward-compatible migrations from the start (additive changes, nullable-then-backfill-then-constrain patterns) so a bad deploy doesn't require an emergency schema rollback at all.

## Troubleshooting

**CI fails at `npm ci`** — usually `package-lock.json` is out of sync with `package.json` (someone ran `npm install` and didn't commit the updated lockfile). Regenerate locally with `npm install`, commit the lockfile, push.

**CI fails lint** — run `npm run lint` locally; fix the reported rule violations (this repo enforces `@typescript-eslint/no-explicit-any` as an error, not a warning).

**CI fails TypeScript** — run `npm run typecheck` locally and fix the reported errors. Don't add `// @ts-ignore` to silence it — fix the underlying type.

**CI fails tests** — run `npm test` locally to reproduce; check whether your change altered a pure function under `src/lib/calculations/` or `src/lib/journey/` without updating its test.

**CI fails build** — run `npm run build` locally to reproduce. Since the build doesn't require real Supabase env vars, a build failure is almost always a real code/type issue, not a missing-secret issue.

**Vercel Preview fails** — check the deployment's build logs in the Vercel dashboard first; if CI passed but Preview fails, suspect a Vercel-specific environment variable that isn't set for the Preview environment (see "Environment variables" above — both variables must be enabled for Preview, not just Production).

**Production deploy succeeds but the page errors** — check the browser console/network tab first; then check Vercel's Function/Runtime logs for that deployment. Confirm Production's environment variables actually point at the intended Supabase project.

**Supabase permission/RLS error (403 / 42501)** — see `docs/SUPABASE_SETUP.md` → "Troubleshooting"; almost always a missing `GRANT`, not a missing/broken policy.

**Environment variable missing** — locally: is it in `.env.local`? In Vercel: is it set for the environment (Production vs. Preview) that's actually failing?

**OTP/auth issue** — confirm it's not a Dashboard-side config issue first (Site URL, Redirect URLs, email template missing `{{ .Token }}`) before changing application code — see "Supabase Auth configuration changes" above and `docs/SUPABASE_SETUP.md`.

**Migration dry-run shows unexpected SQL** — stop. Don't apply it. Re-read the migration file for a typo or an unintended `DROP`/`CASCADE`, and confirm you're linked to the project you think you are (`npx supabase migration list`).

**Database migration fails when applying** — read the Postgres error carefully (constraint violation, type mismatch against existing data, etc.); fix the migration file, dry-run again, and only then re-apply. Never force it through.

**Local app works but production doesn't** — the most common causes, in order: a Vercel env var missing/wrong for Production specifically, a migration that was applied to a different Supabase project than the one Production points at, or a Supabase Dashboard auth setting (Site URL/Redirect URLs) that's only configured for `localhost`.

## Quick reference

**Code-only change**
```
branch → edit → npm run lint/typecheck/test/build → push → PR → CI → Vercel Preview → merge → production
```

**Database change**
```
branch → edit → migration → local review → PR → CI (migration notice) → review SQL →
npx supabase db push --dry-run → manual npx supabase db push → verify DB → merge → production
```

**Auth/email config change**
```
update Supabase Dashboard (and/or the email provider) → test sign-in → deploy app only if source code also changed
```

**Environment variable change**
```
update the value in Vercel (Production and/or Preview) → redeploy → verify
```

---

## Data storage

**Supabase Postgres is the authoritative source of truth**, scoped to your household and protected by Row Level Security — a household can only ever read or write its own rows, enforced in the database, not just in the UI. Sign in on your Mac, iPhone, and iPad and the same data appears everywhere: saving a property on one device makes it appear on another the next time that device is open or regains focus (see `src/lib/data/use-query.ts` — a small refetch-on-focus/refetch-on-mutation mechanism, not a websocket sync engine).

`localStorage` is used only for things that are deliberately *not* shared data: the theme preference, and a temporary unsaved-notes draft for the property visit form (cleared automatically once that save succeeds — protection against losing typed notes to a bad connection, not an offline mode).

> This is not full offline support. Actions require a network connection; a failed save shows an error, keeps what you typed, and offers Retry.

### Local data migration

If you used an earlier, local-only version of this app in a browser, a **"Local Home data found"** banner appears once after you sign in. It shows record counts, downloads a JSON backup of that local data first, then imports it into your household's cloud database on confirmation — the local copy in that browser is never deleted, and the banner never reappears once you've imported (or explicitly dismissed it).

### Backup & restore

- **Export** (Settings → Data & backups, or the reminder banner) downloads a timestamped `homescope-backup-YYYY-MM-DD-HHMM.json` containing your household's entire cloud database.
- **Import** validates the file with Zod first, shows a **preview of counts**, and warns that importing **replaces all current data**. A cloud snapshot is saved automatically first (in `localStorage`, for a quick same-device rollback) — the JSON export remains your real independent backup.
- **Printable reports:** a single property (Properties → property → *Print report*) and the shortlist comparison (Compare → *Print comparison*).

---

## Calculation assumptions

All calculations live in tested pure functions under `src/lib/calculations/` and are labeled as estimates in the UI.

- **Mortgage payment** uses the standard fixed-rate amortization formula
  `M = P · r(1+r)ⁿ / ((1+r)ⁿ − 1)`, degrading to straight-line principal at a 0% rate.
- **Lender-style monthly payment** = principal & interest + property taxes/12 + insurance/12 + HOA + mortgage insurance (PMI).
- **PMI** is estimated only when the down payment is under 20% (default 0.6%/yr of the loan). It can be turned off (e.g. physician loans).
- **Real monthly ownership cost** = lender-style payment + maintenance reserve + optional utilities + optional commute difference + optional renovation savings. Maintenance defaults to 1%/yr of value.
- **Cash required at closing** = down payment + closing costs + prepaid/escrow + immediate renovation + moving. **Retirement funds are never counted as available closing cash by default.**
- **Reserves** are compared against an editable minimum and preferred target.
- **DTI / income shares** are planning estimates, not lender underwriting.
- **Guardrail bands** classify a value against your thresholds as *Within comfortable range → Above comfortable range → Near maximum → Beyond walk-away limit*, or *Missing information* when an input is absent. Warnings are calm and factual and never block saving.
- **Lender 5-year figures** sum interest over the first 60 scheduled payments; upfront cost = points (as dollars) + flat fees.
- **Overall property score** is a transparent weighted average of your 1–5 ratings; unrated items are omitted, not counted as zero.
- **School data** is treated as research only — never derived from a town name. You record the assigned schools, source, verified date, rating/metric, notes, and a confidence rating, with a standing reminder that boundaries and ratings change and must be independently verified.

Defaults used when a property leaves a field blank: property taxes fall to the entered value or 0; insurance ≈ 0.35% of price; escrow/prepaids ≈ 3 months of taxes + insurance; closing costs ≈ 2.5% of price; rate/term/maintenance fall back to your Settings defaults. All household/financial planning defaults start **blank** — nothing is pre-filled with real figures; you enter your own in Settings.

---

## Project structure

```
.github/
  workflows/ci.yml          # "HomeScope CI" — lint · typecheck · test · build; never deploys
docs/
  SUPABASE_SETUP.md          # deep dive: migrations, RLS/grants model, auth flow, troubleshooting
supabase/
  migrations/               # 0001 schema · 0002 functions (RPCs) · 0003 RLS policies · 0004 Data API grants
src/
  middleware.ts              # preview gate first (see "Preview access gate" above), then refreshes
                              #   the Supabase session; redirects unauthenticated requests to /login,
                              #   except the public paths (/, /get-started, /login, /auth/callback,
                              #   /preview-access) — see "Public entry & sign-in" above
  app/
    page.tsx                # public welcome page ("/"), or redirects an authenticated visitor to /journey
    get-started/            # public buyer/homeowner pre-selection ("/get-started")
    preview-access/          # temporary preview-gate entry page, form, and validation server action
    login/                  # email OTP + magic-link sign-in (also serves sign-up)
    auth/callback/          # PKCE code exchange for the magic-link path
    manifest.ts icon.tsx apple-icon.tsx icons/  # PWA manifest + generated icons
    (app)/                  # every authenticated page, wrapped by HouseholdProvider + WorkspaceGate + AppShell;
                              #   AppShell/AppNav/BottomNav render per-mode via lib/workspace/navigation.ts
      journey/               # buyer: Journey overview (landing, "/journey") + [stageId]/ guided step pages (18 stages)
      properties/             # buyer: list + [id] detail (+ per-property deal)
      visit/[id]/              # buyer: Visit mode
      professionals/ resources/ compare/ finances/ lenders/ timeline/ toolkit/  # buyer-only tools
      homebase/ maintenance/    # homeowner: landing page + maintenance placeholder (see docs/WORKSPACE_MODE.md)
      notes/                  # shared by both modes — freeform notes
      paths/                  # "Change path" — re-opens the onboarding flow, pre-filled
      settings/
    layout.tsx globals.css
  components/
    ui.tsx                  # primitives (Button, Panel, Field, BandPill, SaveIndicator …)
    marketing/               # public welcome page + /get-started (header, hero, principles, footer)
    workspace/                # path cards, buyer/owner onboarding forms, WorkspaceGate
    journey/ professional/ documents/ property/deal-section.tsx lender/approvals.tsx
    migration-banner.tsx    # the one-time "Local Home data found" import flow
    modal.tsx toast.tsx app-nav.tsx app-shell.tsx bottom-nav.tsx providers.tsx …
  lib/
    preview-gate/            # config, signed-cookie token, timing-safe compare, in-memory rate
                              #   limit, return-to sanitization — see "Preview access gate" above
    supabase/               # browser client, server client, middleware helper
    workspace/                # buyer/homeowner mode: resolver, service, hooks, onboarding-gate,
                              #   navigation.ts (per-mode nav config + route protection), mode-context.tsx,
                              #   provisional-path.ts (pre-auth path hint) — see docs/WORKSPACE_MODE.md
    household/               # HouseholdProvider (bootstrap + new-household seeding), current-household id
    data/                    # use-query.ts (fetch/refetch primitive), invalidation.ts, save-status.ts, draft.ts
    calculations/           # tested pure functions (mortgage, closing, dti,
                            #   guardrails, ownership, lender, score, summary)
    guide/                  # the 18-stage guide CONTENT (versioned TS, not data):
                            #   types, stages/{planning,team,transaction}, index
    journey/                # the ENGINES over stored state (pure, tested):
                            #   snapshot, criteria (autoChecks), personalization,
                            #   progress (weighted), next-actions, use-snapshot
    models/                 # Zod schemas + inferred types (incl. journey,
                            #   professional, resource, document, deal). Property
                            #   has two: propertySchema (strict persisted domain
                            #   object) and propertyFormSchema (relaxed draft — a
                            #   form may render with an empty address).
    seed/                   # editable profile (blank defaults), samples, timeline,
                            #   checklists, curated resources; cloud.ts seeds a new household
    db.ts repo.ts hooks.ts   # repo.ts/hooks.ts are Supabase-backed; db.ts is the
                            #   read-only legacy Dexie store used only by migration.ts
    migration.ts             # the one-time local-data → cloud import flow
    backup.ts                # export / validated import (both legacy-local and cloud), snapshot
    property-finance.ts finance-presets.ts lender-estimate.ts
    property-form.ts         # draft ↔ persisted Property adapters: a form
                            #   starts as a draft (empty fields allowed) and is
                            #   validated into a Property only at save time
    property-search.ts       # pure Homes search-box filter (blank/whitespace
                            #   query matches everything; no external lookup)
    format.ts labels.ts util.ts theme.ts
```

The distinction between `lib/guide` (content) and `lib/journey` (engines over saved state) is deliberate: editing guide wording never orphans a household's progress, because state rows are keyed by the stable content ids.

### Tested behavior

`npm test` covers the calculation core (mortgage payment, cumulative interest, closing cash, reserves, DTI, guardrail classification, the combined plan evaluation, comparison, lender estimates, the overall score), JSON export/import validation, the legacy local database (seeding idempotency and the export → wipe → import round-trip, plus the migration read path that a real browser upgrade would exercise), and a **journey engine suite** verifying guide-content integrity (18 unique stages, globally-unique action/decision ids, an attending contract weighted far above reading a resource), deterministic `autoCheck` criteria (guardrails, childcare, the attending-timing risk, distinct-lender counting, visit-before-Primary), weighted progress and descriptive readiness, the next-action rules (including the critical walk-away-exceeded warning), and personalization token substitution. It also covers the **property form draft ↔ persisted boundary** (`lib/property-form`: a draft may start with an empty address; `prepareProperty` trims and rejects an empty/whitespace address inline, and only a saved property must satisfy the strict `propertySchema`) and the Homes search filter (`lib/property-search`).

The Supabase-backed read/write layer (`lib/hooks.ts`, `lib/repo.ts`) is not covered by automated tests — there is no CI Supabase instance to run against (see "Suggested future enhancements"). It has been verified manually against a real project.

The **preview access gate** (`lib/preview-gate/`) is covered end-to-end at the request level: `gate.test.ts` drives `evaluatePreviewGate` with real `NextRequest` objects (disabled passes everything through; enabled redirects unauthorized page requests and returns the documented JSON shape for `/api/*`; `/preview-access` itself is always reachable; a valid cookie passes, an expired/tampered/wrong-secret cookie doesn't; a missing-secret misconfiguration fails closed with a 503 everywhere except the access page). `token.test.ts`, `return-to.test.ts`, `rate-limit.test.ts`, `crypto.test.ts`, and `config.test.ts` cover the signed-cookie round trip and rotation/version invalidation, open-redirect rejection, the rate limiter's window/reset behavior, the timing-safe comparison, and env-var validation, respectively. The page and server action themselves (`app/preview-access/`) aren't unit tested, for the same reason as the Supabase layer above — they depend on Next's request-scoped `cookies()`/`headers()`/`redirect()`, which need a running Next server rather than a bare Vitest environment.

---

## Known limitations

- Estimates use simplified defaults (insurance, escrow, PMI, maintenance). Confirm real numbers with your lender, attorney, and insurer.
- School information is only as good as what you record and verify.
- The document index records only that a document exists and where it lives — no files are stored, and sensitive documents deliberately stay out of the database.
- No photos or calendar integration (by design).
- The buyer owner labels default to "Me" / "Partner"; names shown in Settings are editable, but the task-owner labels use the defaults.
- No true offline mode: actions need a network connection. Only property visit notes keep a temporary local draft against a bad connection.

## Suggested future enhancements (not part of the MVP, not implemented)

These are intentionally out of scope and would be added later, if ever:

- Realtime (websocket) sync instead of refetch-on-focus, if the refetch cadence ever feels slow in practice
- Secure document storage (inspection reports, disclosures)
- Photo attachments per property and per visit
- Calendar integration for showings and deadlines
- Optional market-data import for comparable sales
- Inspection-document organization
- A Docker-based local Supabase instance (`supabase start`) wired into CI for real migration/RLS testing (e.g. pgTAP) — deliberately not built now; it would add meaningful CI infrastructure for a personal project whose migrations are already reviewed by hand before every production apply
