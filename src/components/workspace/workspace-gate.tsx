"use client";

import { useRouter, usePathname } from "next/navigation";
import { useActiveWorkspace } from "@/lib/workspace/hooks";
import { resolvePathGate } from "@/lib/workspace/onboarding-gate";
import { getDefaultRouteForMode, isRouteAvailableForMode } from "@/lib/workspace/navigation";
import { ActiveModeProvider } from "@/lib/workspace/mode-context";
import { clearProvisionalPath, readProvisionalPath } from "@/lib/workspace/provisional-path";
import { WorkspaceOnboarding } from "./workspace-onboarding";

/**
 * The app-level gate. Sits inside HouseholdProvider (so the active household is
 * already resolved) and, before any household-scoped screen renders, decides —
 * via `resolvePathGate` — whether the user still needs to pick a path.
 *
 *   loading        → a calm placeholder
 *   path-selection → the full-screen landing + onboarding (no app chrome)
 *   app            → the normal application
 *
 * On completion the service invalidates the workspace row, so `useActiveWorkspace`
 * refetches, the gate re-resolves to "app", and we send the user to that
 * mode's default destination (`getDefaultRouteForMode`) — Journey for a
 * buyer, HomeBase for a homeowner. A returning user with a mode already set
 * never sees this.
 *
 * Once in the "app" state, this is also where mode-based route protection
 * lives: a buyer on a homeowner-only URL (or vice versa) is redirected to
 * their mode's default route rather than rendering the wrong experience —
 * see `isRouteAvailableForMode` in lib/workspace/navigation.ts.
 *
 * If the visitor picked a path on /get-started before they had an account, it
 * is passed here as `initialMode` so the path step opens pre-selected instead
 * of asking again from a blank slate.
 */
export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const view = useActiveWorkspace();
  const state = resolvePathGate(view);

  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="animate-fade-in text-ink-subtle">Loading your HomeScope…</div>
      </div>
    );
  }

  if (state === "path-selection") {
    return (
      <WorkspaceOnboarding
        initialMode={readProvisionalPath()}
        onComplete={(mode) => {
          clearProvisionalPath();
          router.replace(getDefaultRouteForMode(mode));
        }}
      />
    );
  }

  // state === "app": view is guaranteed to be resolved with a selected mode here.
  if (!isRouteAvailableForMode(pathname, view!.mode)) {
    router.replace(getDefaultRouteForMode(view!.mode));
    return (
      <div className="flex min-h-screen items-center justify-center bg-canvas">
        <div className="animate-fade-in text-ink-subtle">Loading your HomeScope…</div>
      </div>
    );
  }

  return <ActiveModeProvider mode={view!.mode}>{children}</ActiveModeProvider>;
}
