# Workspace mode — buyer / homeowner domain foundation

HomeScope supports two primary experiences: **home buyer** (`buying`) and
**homeowner** (`owning`). This document explains the data model behind them and,
in particular, **why the mode is stored at the workspace level** rather than on
the user. The first PR established the foundation (schema, resolver, service,
hooks); the path-selection + onboarding UI described under
"[Path selection & onboarding](#path-selection--onboarding)" ships on top of it.

## One shared foundation, not two apps

Buyer and homeowner are two modes of the *same* application. There is one
persistence layer (Supabase/Postgres, authoritative), one state pattern
(`useQuery` + table invalidation), one household/membership/RLS model, and one
set of shared entities (homes, notes, documents, tasks). Choosing a mode
changes which guidance and surfaces are emphasized — it does **not** fork the
schema. Buyer *experience* (first-time / repeat) and *arrangement*
(solo / partner / group) are profile metadata; none of them create separate,
duplicated journey tables.

## The household *is* the workspace

A "workspace" is the existing `households` row, viewed through a typed lens
(`HomeWorkspace`). We did not add a second container table: the household
already owns all household-scoped data and already has the
membership/RLS/active-household machinery (`bootstrap_household()`,
`user_preferences.active_household_id`). Reusing it keeps the change small and
avoids a parallel ownership model.

`HomeWorkspace` maps 1:1 onto `households`:

| HomeWorkspace | households column |
| --- | --- |
| `id` | `id` |
| `name` | `name` |
| `activeMode` | `activeMode` (new) |
| `createdAt` / `updatedAt` | `createdAt` / `updatedAt` |

## Why mode lives on the workspace, not the user

Storing `activeMode` on the workspace (household) rather than as a boolean/enum
on the user is the central decision:

1. **A household is shared.** Two members of the same household are on the same
   journey. A per-user mode would let two people in one household disagree
   about whether they are buying or owning — an incoherent state. Per-workspace,
   the mode is a single shared fact.
2. **Mode is a property of the journey, not the person.** The same person is a
   buyer this year and a homeowner next year. Those are two *states of a
   workspace over time* (or, later, two workspaces), not a permanent trait of
   the account. A boolean on the user would have to be flipped destructively and
   would fight the "one account, evolving journey" model.
3. **It keeps the multi-workspace future open without building it now.** The
   data model already allows a user to have more than one workspace later (mode
   is per-workspace, and `user_preferences.active_household_id` already selects
   the active one). This PR deliberately ships a single-active-workspace UI and
   **no** multi-workspace management interface.

We also did **not** create separate buyer/homeowner user accounts, partner
invitations, or real-time collaboration. Partner/group are metadata only; the
real collaboration primitive remains the existing household-membership feature.

## `null` = "mode not selected" (compatibility)

`households.activeMode` is nullable and **not backfilled**. Every existing
account therefore reads as `null`, which the resolver reports as `unselected`
→ `needsPathSelection: true`, so after PR 2 ships the path-selection screen,
existing users are routed there instead of being guessed into a mode. A new
household likewise starts `null`. Existing buyer data stays associated with its
existing household (the default workspace); we do not infer profile details
that were never actually chosen.

## The mode resolver

UI and feature code must read the current workspace and mode through the
**resolver** (`src/lib/workspace/resolver.ts`) — never by reading `activeMode`
off a row and branching inline. `resolveWorkspace(workspace)` returns a typed
`WorkspaceView { workspace, mode, isModeSelected, needsPathSelection }` where
`mode` is `"buying" | "owning" | "unselected"`. The `"unselected"` value is
first-class (not `null`), forcing every consumer to handle the not-chosen-yet
case explicitly. `useActiveWorkspace()` (`src/lib/workspace/hooks.ts`) is the
React entry point, built on the same `useQuery` primitive as the existing
singleton reads.

## Layout

- `src/lib/models/workspace.ts` — Zod schemas/types: `homeWorkspaceSchema`,
  `workspaceModeSchema`, `buyerModeProfileSchema`, `ownerModeProfileSchema`.
- `src/lib/workspace/resolver.ts` — pure mode resolver.
- `src/lib/workspace/service.ts` — read/write service (client-injected core +
  app wrappers), including the atomic `completeBuyer/OwnerOnboarding` used by the
  onboarding flow.
- `src/lib/workspace/hooks.ts` — `useActiveWorkspace()` / `useWorkspaceMode()`
  plus `useBuyer/OwnerModeProfile()` for pre-filling the change-path screen.
- `src/lib/workspace/onboarding-gate.ts` — the pure `resolvePathGate` decision.
- `src/components/workspace/` — the path cards, the two onboarding forms, the
  full-screen `WorkspaceOnboarding` flow, and the `WorkspaceGate`.
- `src/app/(app)/paths/page.tsx` — the "Change path" screen (overlay, pre-filled).
- `supabase/migrations/0012_workspace_mode_schema.sql` — `households.activeMode`
  plus `buyerModeProfile` / `ownerModeProfile` singletons.
- `supabase/migrations/0013_workspace_mode_policies.sql` — RLS for the two new
  tables (household-scoped, `authenticated`).
- `supabase/migrations/0014_workspace_mode_grants.sql` — Data API grants.

Enum values use the codebase's lowercase convention (`first-time`,
`single-family`, …), matching `taskStatus`/`selectionStatus`/`renovationTolerance`.

## Path selection & onboarding

A user with no mode selected must choose a path before seeing the app. That
gate is one pure decision (`src/lib/workspace/onboarding-gate.ts`,
`resolvePathGate`) over the resolved view: `loading` → `path-selection` →
`app`. It is mounted once, in the `(app)` layout, as `WorkspaceGate` — *inside*
`HouseholdProvider` (so the active household is already resolved) and *around*
`AppShell`, so the landing renders full-screen without app chrome.

The flow (`src/components/workspace/`) is two short steps:

1. **Landing** — the two path cards (`path-cards.tsx`), each an accessible,
   keyboard-navigable radio (not a div click handler): buyer in the mint/teal
   `accent`, homeowner in the amber/gold `caution` token. A notes-first message
   makes clear nothing is auto-populated.
2. **Compact profile** — one small step per path (`buyer-onboarding-form.tsx` /
   `owner-onboarding-form.tsx`). Buyer asks experience + arrangement (+ optional,
   non-binding participant names); owner asks property type + ownership stage
   (+ optional move-in date).

Nothing is persisted until step 2 is submitted. Completion is atomic
(`completeBuyerOnboarding` / `completeOwnerOnboarding`): the profile is stamped
`onboardingCompletedAt`, then `activeMode` is set. So an abandoned flow stays
`unselected` (the gate shows it again) and a finished flow survives refresh /
logout / login.

Changing the active path later is **non-destructive** — Settings → "HomeScope
path" → *Change path* opens the same flow at `/paths`, pre-filled. Switching
only upserts that path's profile and flips `activeMode`; it never deletes the
other path's profile or any household data. The mode toggle is intentionally
kept out of the main navigation.

## The two profiles vs. the legacy `buyerProfile`

`buyerModeProfile` is **not** the same as the existing `buyerProfile` table.
`buyerProfile` is the household's financial/planning singleton (income,
guardrails, credit scores). `buyerModeProfile` is the small path-selection
record captured at onboarding (`experience`, `arrangement`,
`targetPurchaseDate`, `participantNames`). They are kept separate rather than
overloading the existing table.
