/**
 * The single decision the app-level gate makes: given the resolved workspace
 * view (or `undefined` while it is still loading), which of the three screens
 * should mount? Kept as one pure function so the "new user sees path
 * selection / returning user goes straight to the app" rule is testable in
 * isolation and never re-derived inline in a component.
 *
 * It leans entirely on the resolver's `needsPathSelection` (mode === null) —
 * see resolver.ts — so there is exactly one definition of "hasn't chosen yet".
 */

import type { WorkspaceView } from "./resolver";

/**
 * "loading"        — the active workspace hasn't resolved yet.
 * "path-selection" — no mode chosen; show the landing + onboarding flow.
 * "app"            — a mode is selected; render the normal application.
 */
export type PathGateState = "loading" | "path-selection" | "app";

export function resolvePathGate(view: WorkspaceView | undefined): PathGateState {
  if (!view) return "loading";
  return view.needsPathSelection ? "path-selection" : "app";
}
