# CLAUDE.md

## Project Rules

This repository is a personal production application.

Prioritize:
- safety
- simplicity
- maintainability
- small, reviewable changes
- preserving existing working behavior

Do not over-engineer.

---

## Git Safety

NEVER run commands that publish or merge code unless I explicitly ask.

Do NOT run:

```bash
git push
git push --force
git push -f
git merge
git rebase
gh pr merge
gh pr create

unless I explicitly request that action.

You MAY safely run local commands such as:

git status
git diff
git log
git branch
git checkout -b <branch>
git switch -c <branch>
git add
git commit

Before creating a commit, summarize the changes first.

Never force-push.

Never rewrite shared Git history.

Never delete branches unless explicitly requested.

Deployment Safety

Do NOT deploy automatically.

Do NOT run:

vercel --prod
vercel deploy --prod

or any equivalent production deployment command unless explicitly requested.

Vercel is connected to GitHub and should normally handle:

Pull Request → Preview Deployment
main branch → Production Deployment

Production URL:

https://home.nitinkotcherlakota.com

Do not change production domain configuration unless explicitly requested.

Supabase / Database Safety

Supabase is the source of truth for application data.

Never modify the production database automatically.

Do NOT run:

supabase db push
npx supabase db push
supabase migration up

against the remote production project unless I explicitly approve it.

For database changes:

Create a migration under:
supabase/migrations/
Keep application code and database migration in sync.
Validate locally where possible.
Tell me that a database migration is required.
Provide the exact dry-run command.
Stop and wait for me before applying anything remotely.

Preferred production workflow:

code change
→ migration
→ local validation
→ PR
→ CI
→ review migration
→ db push --dry-run
→ manual approval
→ db push

Never silently modify schema through the Supabase Dashboard.

Do not edit an already-applied migration to change production behavior.

Create a new corrective migration instead.

Destructive Database Changes

Be extremely cautious with:

DROP TABLE
DROP COLUMN
TRUNCATE
DELETE without a restrictive WHERE clause
ALTER COLUMN TYPE
CASCADE

Do not introduce destructive migrations unless clearly necessary.

Before any destructive change:

explain the risk
identify affected data
propose a safer alternative
wait for explicit approval if production data could be lost

Prefer backward-compatible migrations.

RLS and Authorization

Never disable Row Level Security just to make something work.

Never broadly grant access to anon or public as a shortcut.

Preserve the existing authorization model.

When changing:

tables
household ownership
membership
user access
policies
grants

inspect the existing RLS policies first.

Any new user-owned or household-owned table must have appropriate RLS before being considered complete.

Households are never created implicitly on sign-in. Authentication (Supabase Auth) is not household authorization — an authenticated user with no membership must see onboarding, never another household's data and never a silently auto-created empty one.

A user's active household must always be re-resolved server-side from real membership rows (never trusted from client state or a client-supplied household id) before any household-scoped data is shown.

Secrets

Never expose or commit secrets.

Never put secret values into:

NEXT_PUBLIC_*

Never commit:

.env
.env.local
.env.production

unless they contain intentionally safe placeholders.

Never print or store:

Supabase service role key
Supabase secret key
database passwords
Resend API keys
SMTP passwords
private tokens
GitHub tokens
Vercel tokens

Use .env.example with placeholder values when documentation is needed.

Remember:

NEXT_PUBLIC_* = visible to browser users
GitHub Actions

GitHub Actions is a quality gate, not the deployment system.

CI should primarily run on:

pull_request → main

and optionally:

push → main

CI should validate things such as:

npm ci
lint
typecheck
tests
production build

using the repository''s actual scripts.

Do not add deployment logic to GitHub Actions unless explicitly requested.

Do not automatically apply production Supabase migrations from CI.

Do not place production database credentials in GitHub Actions just to automate migrations.

Vercel

Vercel handles deployments through GitHub integration.

Expected workflow:

feature branch
→ Pull Request
→ GitHub Actions
→ Vercel Preview
→ manual testing
→ merge to main
→ Vercel Production

Do not duplicate Vercel deployment logic inside GitHub Actions.

Code Changes

Before implementing a substantial change:

inspect the existing implementation
understand the current architecture
reuse existing patterns
avoid duplicating functionality
make the smallest reasonable change

Do not rewrite large areas of working code unnecessarily.

Do not introduce a library simply because it is popular.

Prefer existing dependencies and patterns when they are adequate.

UI Changes

Preserve the existing product design language unless the request explicitly asks for a redesign.

For UI changes:

verify desktop behavior
verify mobile behavior
consider iPad/tablet layouts
avoid horizontal overflow
avoid multiple page-level scrollbars
preserve accessibility
maintain usable text sizes
maintain light/dark mode behavior if supported

Avoid fixing one viewport by breaking another.

TypeScript

Avoid unnecessary any.

Do not suppress TypeScript errors simply to make the build pass.

Avoid:

// @ts-ignore
// @ts-nocheck

unless there is a very specific documented reason.

Fix the underlying typing issue where practical.

Error Handling

Do not swallow errors silently.

Avoid empty catch blocks.

Provide useful error handling without exposing internal secrets to users.

Log enough information to debug server-side problems while keeping sensitive data private.

Testing

After meaningful code changes, run the relevant available validation commands.

Inspect package.json rather than assuming script names.

Typically this may include:

npm run lint
npm run typecheck
npm test
npm run build

Do not claim that tests passed unless they were actually executed.

If the repository does not have automated tests, say so.

Do not create meaningless tests simply to claim test coverage.

Build Failures

Do not weaken quality checks just to make CI green.

For example, do not:

disable ESLint rules globally
turn off TypeScript strictness
skip tests
add continue-on-error
suppress build failures

unless explicitly justified.

Fix the root cause.

Authentication

Authentication uses Supabase.

Authentication-related configuration may also exist outside this repository, including:

Supabase Site URL
redirect URLs
OTP settings
email templates
SMTP configuration
Resend configuration

Do not assume every auth problem requires a code change.

Production site:

https://home.nitinkotcherlakota.com

Authentication email infrastructure uses:

auth.nitinkotcherlakota.com

Never expose SMTP or Resend credentials.

Documentation

Keep README.md accurate when changes affect:

local setup
environment variables
CI
deployment
database migrations
authentication
application architecture
operational procedures

A developer returning months later should be able to understand how to safely run and deploy the application.

Before Finishing a Task

At the end of a meaningful task, report:

Changed
files created
files modified
important implementation decisions
Validation
commands run
which passed
which failed
Deployment impact

Classify the change as:

A. Code only
B. Code + environment variables
C. Code + database migration
D. Code + auth configuration
E. Infrastructure / CI only
Manual actions

Explicitly tell me whether I need to:

create a PR
update Vercel environment variables
update GitHub secrets/variables
run a Supabase migration
change Supabase Auth configuration
change Resend configuration
Git

Show:

git status

and suggest an appropriate commit message.

Do NOT push.

Default Rule

When unsure whether an action could affect:

production
remote Git
production data
authentication
secrets
deployment

STOP before performing it and tell me what action is required.

Local inspection and validation are encouraged.

Remote mutation requires explicit approval.


I’d also add this tiny section near the very top because it gives Claude a clear operating principle:

```md
## Core Principle

You are allowed to modify and validate the local working copy.

You are not allowed to publish, deploy, merge, or mutate production systems without explicit user approval.