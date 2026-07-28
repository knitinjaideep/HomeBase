"use client";

import { useRouter } from "next/navigation";
import { useActiveWorkspace } from "@/lib/workspace/hooks";
import { resolvePathGate } from "@/lib/workspace/onboarding-gate";
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
 * refetches, the gate re-resolves to "app", and we send the user to the
 * dashboard. A returning user with a mode already set never sees this.
 *
 * If the visitor picked a path on /get-started before they had an account, it
 * is passed here as `initialMode` so the path step opens pre-selected instead
 * of asking again from a blank slate.
 */
export function WorkspaceGate({ children }: { children: React.ReactNode }) {
  const router = useRouter();
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
        onComplete={() => {
          clearProvisionalPath();
          router.replace("/journey");
        }}
      />
    );
  }

  return <>{children}</>;
}
