"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useDocuments, useMaintenanceItems, useOwnedHome, useRepairProjects } from "@/lib/hooks";
import { createDocument } from "@/lib/repo";
import { getMaintenanceUrgency } from "@/lib/maintenance/schedule";
import { dateLabel } from "@/lib/format";
import { MAINTENANCE_URGENCY_LABELS, REPAIR_STATUS_LABELS } from "@/lib/labels";
import { Panel, SectionTitle, EmptyState } from "@/components/ui";
import { HomeOverviewCard } from "@/components/home/home-overview-card";
import { NoteContextPanel } from "@/components/notes/note-context-panel";
import { DocumentContextPanel } from "@/components/documents/document-context-panel";
import { cn } from "@/lib/util";
import type { DocumentCategory } from "@/lib/models";

const OWNER_DOCUMENT_CATEGORIES: DocumentCategory[] = ["warranty", "receipt", "manual", "photo", "home-record"];

const URGENCY_STYLES = {
  overdue: "bg-critical/12 text-critical",
  "due-soon": "bg-caution/15 text-caution",
  upcoming: "bg-surface-muted text-ink-muted",
  "no-date": "bg-surface-muted text-ink-subtle",
} as const;

/**
 * The homeowner dashboard: what home am I maintaining, what needs attention
 * next, what did I recently record, where are my documents/warranties, and
 * quick actions to add more. No fabricated metrics or completion
 * percentages — every number here is a real count or date.
 */
export default function HomeBasePage() {
  const home = useOwnedHome();
  const maintenanceItems = useMaintenanceItems();
  const repairProjects = useRepairProjects();
  const documents = useDocuments();

  const upcoming = useMemo(() => {
    if (!maintenanceItems) return [];
    return maintenanceItems
      .filter((i) => i.status === "active")
      .slice()
      .sort((a, b) => {
        const order = { overdue: 0, "due-soon": 1, upcoming: 2, "no-date": 3 } as const;
        return order[getMaintenanceUrgency(a.dueDate)] - order[getMaintenanceUrgency(b.dueDate)];
      })
      .slice(0, 5);
  }, [maintenanceItems]);

  const recentRepairs = useMemo(() => {
    if (!repairProjects) return [];
    return repairProjects
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 4);
  }, [repairProjects]);

  const ownerDocuments = useMemo(() => {
    if (!documents) return undefined;
    return documents
      .filter((d) => OWNER_DOCUMENT_CATEGORIES.includes(d.category))
      .slice()
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [documents]);

  return (
    <div>
      <div className="mb-8">
        <span className="mb-3 inline-flex items-center rounded-full border border-[color:var(--mode-accent-border)] bg-mode-accent-muted px-2.5 py-0.5 text-xs font-medium text-mode-accent">
          Homeowner
        </span>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">
          {home?.name || home?.address || "Welcome to your HomeBase"}
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
          Ongoing care for your home — maintenance, warranties, and the recurring things that keep it running.
        </p>
      </div>

      <div className="mb-6 flex flex-wrap gap-3">
        <Link href="/maintenance?new=item" className="rounded-lg bg-mode-accent px-4 py-2.5 text-sm font-medium text-white hover:opacity-90">
          Add maintenance item
        </Link>
        <Link
          href="/maintenance?new=project"
          className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Add repair / project
        </Link>
        <Link
          href="/maintenance"
          className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          View all maintenance →
        </Link>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-6">
          {home === undefined ? (
            <Panel className="p-5 text-ink-subtle">Loading…</Panel>
          ) : (
            <HomeOverviewCard home={home} />
          )}

          <Panel className="p-5 sm:p-6">
            <SectionTitle title="Next & upcoming maintenance" className="mb-3" />
            {maintenanceItems === undefined ? (
              <p className="text-sm text-ink-subtle">Loading…</p>
            ) : upcoming.length === 0 ? (
              <EmptyState
                title="Nothing scheduled"
                description="Add a maintenance item or try the starter checklist to get going."
                action={
                  <Link href="/maintenance" className="text-sm font-medium text-mode-accent hover:underline">
                    Go to Maintenance →
                  </Link>
                }
              />
            ) : (
              <ul className="space-y-2">
                {upcoming.map((item) => {
                  const urgency = getMaintenanceUrgency(item.dueDate);
                  return (
                    <li key={item.id}>
                      <Link
                        href={`/maintenance?item=${item.id}`}
                        className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 hover:bg-surface-muted"
                      >
                        <div className="min-w-0">
                          <div className="truncate text-sm font-medium text-ink">{item.title}</div>
                          <div className="text-xs text-ink-subtle">
                            {item.dueDate ? `Due ${dateLabel(item.dueDate)}` : "No date set"}
                            {item.areaOrSystem ? ` · ${item.areaOrSystem}` : ""}
                          </div>
                        </div>
                        <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-medium", URGENCY_STYLES[urgency])}>
                          {MAINTENANCE_URGENCY_LABELS[urgency]}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          <Panel className="p-5 sm:p-6">
            <SectionTitle
              title="Recent repairs or projects"
              className="mb-3"
              action={
                <Link href="/maintenance" className="text-sm font-medium text-mode-accent hover:underline">
                  View all →
                </Link>
              }
            />
            {repairProjects === undefined ? (
              <p className="text-sm text-ink-subtle">Loading…</p>
            ) : recentRepairs.length === 0 ? (
              <EmptyState title="No repairs or projects yet" description="Track a repair — status, cost, and notes." />
            ) : (
              <ul className="space-y-2">
                {recentRepairs.map((project) => (
                  <li key={project.id}>
                    <Link
                      href={`/maintenance?project=${project.id}`}
                      className="flex items-center justify-between gap-3 rounded-lg border border-line px-3 py-2 hover:bg-surface-muted"
                    >
                      <span className="truncate text-sm font-medium text-ink">{project.title}</span>
                      <span className="shrink-0 rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                        {REPAIR_STATUS_LABELS[project.status]}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="space-y-6">
          <NoteContextPanel contextType="ownedHome" contextId={null} title="Recent notes about your home" />

          <DocumentContextPanel
            documents={ownerDocuments}
            title="Documents & warranties"
            onAdd={async (input) => {
              await createDocument(input);
            }}
          />
        </div>
      </div>
    </div>
  );
}
