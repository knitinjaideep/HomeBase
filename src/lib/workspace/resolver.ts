/**
 * The application-level mode resolver. UI and feature code should read the
 * current workspace and mode through this — never by pulling `activeMode`
 * straight off a database row and branching on it inline. Keeping the
 * "null means not selected yet" rule in one typed place is the whole point:
 * it is what makes an existing account (which has no mode after the
 * migration) land on the path-selection screen instead of a broken half-state.
 */

import type { HomeWorkspace, WorkspaceMode } from "@/lib/models";

/**
 * The resolved mode. `"unselected"` is a first-class value, not `null`, so
 * every consumer is forced to handle the "hasn't chosen a path yet" case
 * explicitly rather than accidentally treating it as buying.
 */
export type ResolvedMode = WorkspaceMode | "unselected";

export interface WorkspaceView {
  /** The active workspace (the household, viewed as a workspace). */
  workspace: HomeWorkspace;
  /** "buying" | "owning" | "unselected". */
  mode: ResolvedMode;
  /** True only for a genuine "buying" or "owning" selection. */
  isModeSelected: boolean;
  /** True when the workspace should be sent to the path-selection screen (PR 2). */
  needsPathSelection: boolean;
}

/** Map a raw `activeMode` (which may be null) to a resolved, exhaustive mode. */
export function resolveMode(activeMode: WorkspaceMode | null | undefined): ResolvedMode {
  return activeMode ?? "unselected";
}

/** Resolve a workspace row into the typed view the rest of the app consumes. */
export function resolveWorkspace(workspace: HomeWorkspace): WorkspaceView {
  const mode = resolveMode(workspace.activeMode);
  const isModeSelected = mode !== "unselected";
  return {
    workspace,
    mode,
    isModeSelected,
    needsPathSelection: !isModeSelected,
  };
}

export function isBuying(view: WorkspaceView): boolean {
  return view.mode === "buying";
}

export function isOwning(view: WorkspaceView): boolean {
  return view.mode === "owning";
}
