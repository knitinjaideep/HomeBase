"use client";

import Link from "next/link";
import { useMaintenanceItems, useRepairProjects } from "@/lib/hooks";
import { useJourneySnapshot } from "@/lib/journey/use-snapshot";
import { overallProgress } from "@/lib/journey/progress";
import { phaseForStage } from "@/lib/guide/phases";
import { getMaintenanceUrgency } from "@/lib/maintenance/schedule";
import { useActiveMode } from "@/lib/workspace/mode-context";
import { toolkitGroupsForMode } from "@/lib/toolkit/groups";
import { recommendedNext } from "@/lib/toolkit/recommendations";
import { Panel, SectionTitle } from "@/components/ui";
import { ToolkitGroupsGrid } from "@/components/toolkit/groups-grid";

/**
 * Mode-aware Toolkit: a curated, grouped link directory (not a flat list —
 * see lib/toolkit/groups.ts for how tiles are organized per mode) plus a
 * small deterministic "Recommended next" panel (lib/toolkit/recommendations.ts).
 * Shared between buyer and homeowner mode — see docs/WORKSPACE_MODE.md for
 * why /toolkit itself is no longer buyer-only even though most of the
 * buyer tiles it links to still are.
 */
export default function ToolkitPage() {
  const mode = useActiveMode();
  const groups = toolkitGroupsForMode(mode);

  const snapshot = useJourneySnapshot();
  const maintenanceItems = useMaintenanceItems();
  const repairProjects = useRepairProjects();

  const recommendations =
    mode === "owning"
      ? recommendedNext({
          mode,
          owner: {
            hasUrgentMaintenance: (maintenanceItems ?? []).some(
              (i) => i.status === "active" && ["overdue", "due-soon"].includes(getMaintenanceUrgency(i.dueDate)),
            ),
            hasRepairProjects: (repairProjects ?? []).length > 0,
          },
        })
      : recommendedNext({
          mode,
          buyer: snapshot
            ? {
                currentStagePhaseId: phaseForStage(overallProgress(snapshot).currentStage.id).id,
                hasApprovals: snapshot.approvals.length > 0,
                shortlistedPropertyCount: snapshot.properties.filter((p) => p.status === "shortlisted").length,
              }
            : undefined,
        });

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Toolkit</h1>
        <p className="mt-2 text-sm text-ink-muted sm:text-base">
          Calculators, comparisons, and research — when you need them.
        </p>
      </div>

      {recommendations.length > 0 && (
        <Panel className="mb-8 p-4 sm:p-5">
          <SectionTitle title="Recommended next" className="mb-3" />
          <div className="flex flex-wrap gap-3">
            {recommendations.map((r) => (
              <Link
                key={r.href}
                href={r.href}
                className="flex flex-col rounded-lg border border-line bg-surface px-3.5 py-2.5 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium text-ink">{r.label}</span>
                <span className="text-xs text-ink-subtle">{r.reason}</span>
              </Link>
            ))}
          </div>
        </Panel>
      )}

      <ToolkitGroupsGrid groups={groups} />
    </div>
  );
}
