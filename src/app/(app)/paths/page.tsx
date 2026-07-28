"use client";

import { useRouter } from "next/navigation";
import type { WorkspaceMode } from "@/lib/models";
import {
  useActiveWorkspace,
  useBuyerModeProfile,
  useOwnerModeProfile,
} from "@/lib/workspace/hooks";
import { WorkspaceOnboarding } from "@/components/workspace/workspace-onboarding";

/**
 * The "Change path" / "HomeScope paths" screen, reached from Settings. It
 * reuses the onboarding flow, pre-filled with the current selection, and
 * renders as a full-screen overlay above the app chrome. Switching paths is
 * non-destructive (see completeBuyerOnboarding); Cancel backs out unchanged.
 */
export default function PathsPage() {
  const router = useRouter();
  const view = useActiveWorkspace();
  const buyer = useBuyerModeProfile();
  const owner = useOwnerModeProfile();

  if (view === undefined) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const initialMode: WorkspaceMode | null = view.isModeSelected
    ? (view.mode as WorkspaceMode)
    : null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-canvas">
      <WorkspaceOnboarding
        initialMode={initialMode}
        initialBuyer={buyer ?? null}
        initialOwner={owner ?? null}
        onComplete={() => router.replace("/")}
        onCancel={() => router.back()}
      />
    </div>
  );
}
