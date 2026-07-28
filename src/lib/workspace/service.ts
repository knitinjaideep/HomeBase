/**
 * Workspace service — reads/writes the workspace-level mode and the two
 * path-selection profiles. Two layers, matching patterns already in the repo:
 *
 *   • Core functions take an explicit `SupabaseClient` + `householdId`, the
 *     same shape `seed/cloud.ts`'s `seedNewHousehold(client, id)` uses. That
 *     keeps them unit-testable against an in-memory fake with no real network.
 *   • Thin app wrappers (`updateWorkspaceMode`, `saveBuyerModeProfile`, …)
 *     resolve the client + active household the way `repo.ts` does
 *     (`createClient()` + `getCurrentHouseholdId()`) and invalidate the table
 *     so mounted `useQuery` reads refetch.
 *
 * Row Level Security (0013) is the real access gate; nothing here trusts a
 * client-supplied id beyond the already-resolved active household.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { z } from "zod";
import { createClient } from "@/lib/supabase/client";
import { getCurrentHouseholdId } from "@/lib/household/current";
import { invalidateTable } from "@/lib/data/invalidation";
import { newId, now } from "@/lib/util";
import {
  BUYER_MODE_PROFILE_TABLE,
  OWNER_MODE_PROFILE_TABLE,
  WORKSPACE_TABLE,
  buyerModeProfileSchema,
  homeWorkspaceSchema,
  ownerModeProfileSchema,
  workspaceModeSchema,
  type BuyerModeProfile,
  type HomeWorkspace,
  type OwnerModeProfile,
  type WorkspaceMode,
} from "@/lib/models";
import { resolveWorkspace, type WorkspaceView } from "./resolver";

/**
 * Pin the schema's Input generic to `any` so only its Output type `T` drives
 * inference — schemas with `.default()` fields have an optional-everywhere
 * Input type that would otherwise leak through. Same rationale (and comment)
 * as `AnySchema` in `lib/hooks.ts`.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySchema<T> = z.ZodType<T, z.ZodTypeDef, any>;

// ---- Core (client-injected, testable) -------------------------------------

/** Load the household row as a typed HomeWorkspace. Throws if it is missing. */
export async function loadActiveWorkspace(
  client: SupabaseClient,
  householdId: string,
): Promise<HomeWorkspace> {
  const { data, error } = await client
    .from(WORKSPACE_TABLE)
    .select("*")
    .eq("id", householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data) throw new Error(`Active workspace not found for household ${householdId}`);
  return homeWorkspaceSchema.parse(data);
}

/** Load the active workspace and resolve it into the view the app consumes. */
export async function loadWorkspaceView(
  client: SupabaseClient,
  householdId: string,
): Promise<WorkspaceView> {
  return resolveWorkspace(await loadActiveWorkspace(client, householdId));
}

/**
 * Persist the workspace's mode. The enum is validated here before the write
 * (defence in depth alongside the DB CHECK constraint) so an invalid value
 * never reaches Postgres. `updatedAt` is left to the table's trigger.
 */
export async function setWorkspaceMode(
  client: SupabaseClient,
  householdId: string,
  mode: WorkspaceMode,
): Promise<void> {
  const activeMode = workspaceModeSchema.parse(mode);
  const { error } = await client.from(WORKSPACE_TABLE).update({ activeMode }).eq("id", householdId);
  if (error) throw new Error(error.message);
}

/**
 * Read-then-write upsert for a household-scoped singleton, mirroring
 * `repo.ts`'s `updateAttendingTransition`: patch the existing row if present,
 * otherwise insert a fresh one with schema defaults applied. Avoids relying on
 * Postgres upsert conflict targets and keeps a stable primary key across edits.
 */
async function saveSingleton<T extends { id: string }>(
  client: SupabaseClient,
  table: string,
  householdId: string,
  schema: AnySchema<T>,
  patch: Record<string, unknown>,
): Promise<void> {
  const { data: existing, error: readError } = await client
    .from(table)
    .select("id")
    .eq("householdId", householdId)
    .maybeSingle();
  if (readError) throw new Error(readError.message);

  if (existing) {
    const { error } = await client.from(table).update(patch).eq("householdId", householdId);
    if (error) throw new Error(error.message);
    return;
  }

  const ts = now();
  const row = schema.parse({ id: newId(), createdAt: ts, updatedAt: ts, ...patch });
  const { error } = await client.from(table).insert({ ...row, householdId });
  if (error) throw new Error(error.message);
}

async function loadSingleton<T>(
  client: SupabaseClient,
  table: string,
  householdId: string,
  schema: AnySchema<T>,
): Promise<T | null> {
  const { data, error } = await client
    .from(table)
    .select("*")
    .eq("householdId", householdId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? schema.parse(data) : null;
}

export function loadBuyerModeProfile(
  client: SupabaseClient,
  householdId: string,
): Promise<BuyerModeProfile | null> {
  return loadSingleton(client, BUYER_MODE_PROFILE_TABLE, householdId, buyerModeProfileSchema);
}

export function saveBuyerModeProfile(
  client: SupabaseClient,
  householdId: string,
  patch: Partial<BuyerModeProfile>,
): Promise<void> {
  return saveSingleton(client, BUYER_MODE_PROFILE_TABLE, householdId, buyerModeProfileSchema, patch);
}

export function loadOwnerModeProfile(
  client: SupabaseClient,
  householdId: string,
): Promise<OwnerModeProfile | null> {
  return loadSingleton(client, OWNER_MODE_PROFILE_TABLE, householdId, ownerModeProfileSchema);
}

export function saveOwnerModeProfile(
  client: SupabaseClient,
  householdId: string,
  patch: Partial<OwnerModeProfile>,
): Promise<void> {
  return saveSingleton(client, OWNER_MODE_PROFILE_TABLE, householdId, ownerModeProfileSchema, patch);
}

/**
 * Finish onboarding for a path: stamp the profile as complete and *then* set
 * the workspace mode. Order matters — the mode write is last so that a failure
 * partway through leaves the workspace `unselected` (the gate simply shows the
 * flow again) rather than "in a mode with no profile". Switching from one path
 * to another only upserts that path's profile and flips `activeMode`; it never
 * touches the other path's profile or any household data, so changing the
 * active path is non-destructive.
 */
export async function completeBuyerOnboarding(
  client: SupabaseClient,
  householdId: string,
  patch: Partial<BuyerModeProfile>,
): Promise<void> {
  await saveBuyerModeProfile(client, householdId, { ...patch, onboardingCompletedAt: now() });
  await setWorkspaceMode(client, householdId, "buying");
}

export async function completeOwnerOnboarding(
  client: SupabaseClient,
  householdId: string,
  patch: Partial<OwnerModeProfile>,
): Promise<void> {
  await saveOwnerModeProfile(client, householdId, { ...patch, onboardingCompletedAt: now() });
  await setWorkspaceMode(client, householdId, "owning");
}

// ---- App wrappers ---------------------------------------------------------
// Resolve the browser client + active household and invalidate on write, so
// `useActiveWorkspace()` and the profile reads refetch.

export async function updateWorkspaceMode(mode: WorkspaceMode): Promise<void> {
  await setWorkspaceMode(createClient(), getCurrentHouseholdId(), mode);
  invalidateTable(WORKSPACE_TABLE);
}

export async function updateBuyerModeProfile(patch: Partial<BuyerModeProfile>): Promise<void> {
  await saveBuyerModeProfile(createClient(), getCurrentHouseholdId(), patch);
  invalidateTable(BUYER_MODE_PROFILE_TABLE);
}

export async function updateOwnerModeProfile(patch: Partial<OwnerModeProfile>): Promise<void> {
  await saveOwnerModeProfile(createClient(), getCurrentHouseholdId(), patch);
  invalidateTable(OWNER_MODE_PROFILE_TABLE);
}

/**
 * The two calls the onboarding UI makes. Each resolves the browser client +
 * active household, completes the path, then invalidates both the workspace
 * row and the profile so `useActiveWorkspace()` / the profile hooks refetch
 * and the gate re-resolves into the app.
 */
export async function finishBuyerOnboarding(patch: Partial<BuyerModeProfile>): Promise<void> {
  await completeBuyerOnboarding(createClient(), getCurrentHouseholdId(), patch);
  invalidateTable(BUYER_MODE_PROFILE_TABLE);
  invalidateTable(WORKSPACE_TABLE);
}

export async function finishOwnerOnboarding(patch: Partial<OwnerModeProfile>): Promise<void> {
  await completeOwnerOnboarding(createClient(), getCurrentHouseholdId(), patch);
  invalidateTable(OWNER_MODE_PROFILE_TABLE);
  invalidateTable(WORKSPACE_TABLE);
}
