"use client";

/**
 * Exposes the already-resolved mode to AppShell/AppNav/BottomNav. `WorkspaceGate`
 * only renders this provider once `useActiveWorkspace()` has resolved to a
 * selected mode (its "app" state) — so consumers read a known value
 * synchronously and never run their own independent fetch. That matters: a
 * second `useWorkspaceMode()` call here would start at `undefined` and
 * briefly render buyer nav for a homeowner before its own fetch resolved,
 * exactly the hydration flicker mode-awareness is supposed to avoid. See
 * docs/WORKSPACE_MODE.md and the same pattern in lib/household/context.tsx.
 */

import { createContext, useContext } from "react";
import type { ResolvedMode } from "./resolver";

const ActiveModeContext = createContext<ResolvedMode | null>(null);

export function ActiveModeProvider({
  mode,
  children,
}: {
  mode: ResolvedMode;
  children: React.ReactNode;
}) {
  return <ActiveModeContext.Provider value={mode}>{children}</ActiveModeContext.Provider>;
}

/** The active mode, as already resolved by WorkspaceGate. Only valid inside its "app" state. */
export function useActiveMode(): ResolvedMode {
  const mode = useContext(ActiveModeContext);
  if (mode === null) {
    throw new Error('useActiveMode must be used within ActiveModeProvider (inside WorkspaceGate\'s "app" state)');
  }
  return mode;
}
