"use client";

/**
 * Foundational state for the buyer/homeowner split. `useActiveWorkspace()`
 * resolves the one active workspace (the current household, viewed as a
 * workspace) and its mode through the resolver — the typed entry point PR 2's
 * path-selection screen and every mode-aware component will read from, so no
 * component ever branches on a raw `activeMode` column value itself.
 *
 * Built on the same primitives as the existing `useSingleton` reads in
 * `lib/hooks.ts`: `useHouseholdContext()` for the active household and
 * `useQuery()` for fetch-on-mount + refetch-on-invalidation. It mounts no new
 * provider and renders nothing, so it changes no existing UI.
 */

import { createClient } from "@/lib/supabase/client";
import { useHouseholdContext } from "@/lib/household/context";
import { useQuery } from "@/lib/data/use-query";
import {
  BUYER_MODE_PROFILE_TABLE,
  OWNER_MODE_PROFILE_TABLE,
  WORKSPACE_TABLE,
  type BuyerModeProfile,
  type OwnerModeProfile,
} from "@/lib/models";
import { loadBuyerModeProfile, loadOwnerModeProfile, loadWorkspaceView } from "./service";
import type { ResolvedMode, WorkspaceView } from "./resolver";

/** The active workspace + resolved mode, or `undefined` until the first load. */
export function useActiveWorkspace(): WorkspaceView | undefined {
  const { householdId } = useHouseholdContext();
  return useQuery(() => loadWorkspaceView(createClient(), householdId), {
    deps: [householdId],
    watch: [WORKSPACE_TABLE],
  });
}

/** Convenience: just the resolved mode ("buying" | "owning" | "unselected" | undefined). */
export function useWorkspaceMode(): ResolvedMode | undefined {
  return useActiveWorkspace()?.mode;
}

/**
 * The buyer path-selection profile: `undefined` until first load, then the row
 * or `null` when the household has never saved one. Used to pre-fill the flow
 * when a user revisits it from Settings.
 */
export function useBuyerModeProfile(): BuyerModeProfile | null | undefined {
  const { householdId } = useHouseholdContext();
  return useQuery(() => loadBuyerModeProfile(createClient(), householdId), {
    deps: [householdId],
    watch: [BUYER_MODE_PROFILE_TABLE],
  });
}

/** The owner path-selection profile; same shape/semantics as the buyer hook. */
export function useOwnerModeProfile(): OwnerModeProfile | null | undefined {
  const { householdId } = useHouseholdContext();
  return useQuery(() => loadOwnerModeProfile(createClient(), householdId), {
    deps: [householdId],
    watch: [OWNER_MODE_PROFILE_TABLE],
  });
}
