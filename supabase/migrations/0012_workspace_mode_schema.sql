-- HomeScope — workspace mode schema (buyer / homeowner domain foundation)
--
-- Establishes the data model for HomeScope's two primary experiences —
-- home buyer and homeowner — at the *workspace* level. A workspace is the
-- existing `households` row (the household IS the workspace; see
-- docs/WORKSPACE_MODE.md for why mode lives here and not on the user).
--
-- Three additive changes, all backward-compatible:
--   1. households gains a nullable `activeMode`. NULL is the deliberate
--      compatibility state for every existing account — it reads as
--      "mode not selected" and routes to path selection (PR 2). No backfill:
--      existing buyer data stays associated with its existing household
--      (= the default workspace), and we do not infer a mode/profile that
--      was never actually chosen.
--   2. buyerModeProfile — path-selection metadata for BUYING mode. Distinct
--      from the legacy `buyerProfile` singleton (financial/planning figures);
--      this is the small "how are you approaching this purchase" record.
--   3. ownerModeProfile — the OWNING-mode equivalent.
--
-- Both new tables follow the exact conventions of the existing singletons
-- (quoted camelCase columns matching the Zod field names, one row per
-- household enforced by a UNIQUE "householdId", cascade on household delete,
-- and the shared set_updated_at trigger). RLS is enabled here; policies live
-- in 0013 and grants in 0014, matching the 0001/0003/0004 split.
--
-- Enum values use the codebase's lowercase convention (compare
-- renovationTolerance / selectionStatus) rather than SCREAMING_SNAKE.

-- ---------------------------------------------------------------------------
-- 1. Workspace mode on the household
-- ---------------------------------------------------------------------------

alter table households
  add column "activeMode" text
    check ("activeMode" is null or "activeMode" in ('buying', 'owning'));

-- ---------------------------------------------------------------------------
-- 2. Buyer mode profile (one row per household)
-- ---------------------------------------------------------------------------

create table "buyerModeProfile" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  experience text not null default 'first-time'
    check (experience in ('first-time', 'repeat')),
  arrangement text not null default 'solo'
    check (arrangement in ('solo', 'partner', 'group')),
  "targetPurchaseDate" text,
  "participantNames" text[] not null default '{}',
  "onboardingCompletedAt" timestamptz
);

-- ---------------------------------------------------------------------------
-- 3. Owner mode profile (one row per household)
-- ---------------------------------------------------------------------------

create table "ownerModeProfile" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "propertyType" text not null default 'single-family'
    check ("propertyType" in ('single-family', 'condo-townhouse', 'other')),
  "ownershipStage" text not null default 'new-owner'
    check ("ownershipStage" in ('new-owner', 'established-owner')),
  "moveInDate" text,
  "onboardingCompletedAt" timestamptz
);

alter table "buyerModeProfile" enable row level security;
alter table "ownerModeProfile" enable row level security;

-- The shared updatedAt trigger is applied per-table (0001 used a static list),
-- so the two new tables need it added explicitly.
create trigger set_updated_at before update on "buyerModeProfile"
  for each row execute function public.set_updated_at();
create trigger set_updated_at before update on "ownerModeProfile"
  for each row execute function public.set_updated_at();
