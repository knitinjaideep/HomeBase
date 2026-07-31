"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useMaintenanceItems, useRepairProjects } from "@/lib/hooks";
import { getMaintenanceUrgency, type MaintenanceUrgency } from "@/lib/maintenance/schedule";
import { PageHeader, Panel, Button, Field, Select, EmptyState } from "@/components/ui";
import { MaintenanceItemRow } from "@/components/maintenance/maintenance-item-row";
import { AddMaintenanceItemForm } from "@/components/maintenance/add-maintenance-item-form";
import { RepairProjectRow } from "@/components/maintenance/repair-project-row";
import { AddRepairProjectForm } from "@/components/maintenance/add-repair-project-form";
import { StarterTemplatePicker } from "@/components/maintenance/starter-template-picker";
import { cn } from "@/lib/util";

type Tab = "maintenance" | "repairs";

const URGENCY_ORDER: Record<MaintenanceUrgency, number> = { overdue: 0, "due-soon": 1, upcoming: 2, "no-date": 3 };

/**
 * The maintenance tracker: recurring/one-time maintenance items, and a
 * lightweight repairs/projects tab (deliberately not a separate nav
 * destination — see docs/WORKSPACE_MODE.md's owner nav list). Deep-linkable
 * from a note's "View" link via ?item=<id> / ?project=<id> (see
 * lib/notes/context.ts), and from HomeBase's quick actions via ?new=item /
 * ?new=project.
 */
export default function MaintenancePage() {
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<Tab>(searchParams.get("project") ? "repairs" : "maintenance");
  const [showAdd, setShowAdd] = useState(searchParams.get("new") === "item" || searchParams.get("new") === "project");
  const [showTemplates, setShowTemplates] = useState(false);
  const [statusFilter, setStatusFilter] = useState<"active" | "all">("active");

  const maintenanceItems = useMaintenanceItems();
  const repairProjects = useRepairProjects();

  const focusItemId = searchParams.get("item");
  const focusProjectId = searchParams.get("project");

  const sortedItems = useMemo(() => {
    if (!maintenanceItems) return [];
    const filtered = statusFilter === "active" ? maintenanceItems.filter((i) => i.status === "active") : maintenanceItems;
    return filtered.slice().sort((a, b) => {
      if (a.status === "active" && b.status === "active") {
        return URGENCY_ORDER[getMaintenanceUrgency(a.dueDate)] - URGENCY_ORDER[getMaintenanceUrgency(b.dueDate)];
      }
      if (a.status === "active" !== (b.status === "active")) return a.status === "active" ? -1 : 1;
      return 0;
    });
  }, [maintenanceItems, statusFilter]);

  const sortedProjects = useMemo(() => {
    if (!repairProjects) return [];
    return repairProjects.slice().sort((a, b) => {
      const aOpen = a.status === "planned" || a.status === "in-progress";
      const bOpen = b.status === "planned" || b.status === "in-progress";
      return aOpen === bOpen ? 0 : aOpen ? -1 : 1;
    });
  }, [repairProjects]);

  return (
    <div>
      <PageHeader
        title="Maintenance"
        description="Recurring tasks, one-time repairs, and the history of what's been done."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowTemplates((s) => !s)}>
              {showTemplates ? "Close checklist" : "Starter checklist"}
            </Button>
            <Button onClick={() => setShowAdd((s) => !s)}>
              {showAdd ? "Close" : tab === "maintenance" ? "Add maintenance item" : "Add repair / project"}
            </Button>
          </>
        }
      />

      <div className="mb-5 flex gap-2">
        <TabButton active={tab === "maintenance"} onClick={() => setTab("maintenance")}>
          Maintenance
        </TabButton>
        <TabButton active={tab === "repairs"} onClick={() => setTab("repairs")}>
          Repairs &amp; projects
        </TabButton>
      </div>

      {showTemplates && <StarterTemplatePicker onDone={() => setShowTemplates(false)} />}

      {tab === "maintenance" ? (
        <>
          {showAdd && <AddMaintenanceItemForm onDone={() => setShowAdd(false)} />}
          <div className="mb-4 flex items-center justify-end">
            <Field label="Show" className="w-56">
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "active" | "all")}>
                <option value="active">Active only</option>
                <option value="all">All (incl. completed / skipped / archived)</option>
              </Select>
            </Field>
          </div>
          {maintenanceItems === undefined ? (
            <p className="text-ink-subtle">Loading…</p>
          ) : sortedItems.length === 0 ? (
            <EmptyState
              title="No maintenance items yet"
              description="Add your first item, or use the starter checklist to get going quickly."
            />
          ) : (
            <Panel className="px-4 sm:px-5">
              <ul>
                {sortedItems.map((item) => (
                  <MaintenanceItemRow key={item.id} item={item} defaultOpen={item.id === focusItemId} />
                ))}
              </ul>
            </Panel>
          )}
        </>
      ) : (
        <>
          {showAdd && <AddRepairProjectForm onDone={() => setShowAdd(false)} />}
          {repairProjects === undefined ? (
            <p className="text-ink-subtle">Loading…</p>
          ) : sortedProjects.length === 0 ? (
            <EmptyState
              title="No repairs or projects yet"
              description="Track a repair or small project — status, cost, and notes, without project-management overhead."
            />
          ) : (
            <Panel className="px-4 sm:px-5">
              <ul>
                {sortedProjects.map((project) => (
                  <RepairProjectRow key={project.id} project={project} defaultOpen={project.id === focusProjectId} />
                ))}
              </ul>
            </Panel>
          )}
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-lg px-3.5 py-2 text-sm font-medium transition-colors",
        active ? "bg-mode-accent-muted text-mode-accent" : "text-ink-muted hover:bg-surface-muted hover:text-ink",
      )}
    >
      {children}
    </button>
  );
}
