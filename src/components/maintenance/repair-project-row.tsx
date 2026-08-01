"use client";

import { useState } from "react";
import { cancelRepairProject, completeRepairProject, deleteRepairProject, updateRepairProject } from "@/lib/maintenance/service";
import { useDocumentsForRepairProject } from "@/lib/hooks";
import { createDocument } from "@/lib/repo";
import { dateLabel, money } from "@/lib/format";
import { PRIORITY_LABELS, REPAIR_STATUS_LABELS } from "@/lib/labels";
import { Field, Input, Select, Textarea, Button } from "@/components/ui";
import { NoteContextPanel } from "@/components/notes/note-context-panel";
import { DocumentContextPanel } from "@/components/documents/document-context-panel";
import { cn } from "@/lib/util";
import type { Priority, RepairProject, RepairStatus } from "@/lib/models";

export function RepairProjectRow({ project, defaultOpen = false }: { project: RepairProject; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const documents = useDocumentsForRepairProject(project.id);
  const isOpenStatus = project.status === "planned" || project.status === "in-progress";

  return (
    <li id={`repair-project-${project.id}`} className="border-t border-line first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-3 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-medium", !isOpenStatus ? "text-ink-subtle" : "text-ink")}>
              {project.title}
            </span>
            {project.priority === "high" && <span className="text-xs text-caution">High priority</span>}
            <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
              {REPAIR_STATUS_LABELS[project.status]}
            </span>
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-subtle">
            {project.startDate && <span>Started {dateLabel(project.startDate)}</span>}
            {project.completionDate && <span>Completed {dateLabel(project.completionDate)}</span>}
            {project.estimatedCost !== null && <span>Est. {money(project.estimatedCost)}</span>}
            {project.actualCost !== null && <span>Actual {money(project.actualCost)}</span>}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {isOpenStatus && (
            <>
              <Button
                size="sm"
                onClick={() => void completeRepairProject(project.id, new Date().toISOString().slice(0, 10))}
              >
                Mark completed
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void cancelRepairProject(project.id)}>
                Cancel
              </Button>
            </>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-ink-muted hover:text-ink">
            {open ? "Close" : "Details"}
          </button>
        </div>
      </div>

      {open && (
        <div className="animate-rise space-y-4 pb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input defaultValue={project.title} onBlur={(e) => void updateRepairProject(project.id, { title: e.target.value })} />
            </Field>
            <Field label="Status">
              <Select
                value={project.status}
                onChange={(e) => void updateRepairProject(project.id, { status: e.target.value as RepairStatus })}
              >
                {(Object.keys(REPAIR_STATUS_LABELS) as RepairStatus[]).map((s) => (
                  <option key={s} value={s}>
                    {REPAIR_STATUS_LABELS[s]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Priority">
              <Select
                value={project.priority}
                onChange={(e) => void updateRepairProject(project.id, { priority: e.target.value as Priority })}
              >
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Start date">
              <Input
                type="date"
                value={project.startDate ?? ""}
                onChange={(e) => void updateRepairProject(project.id, { startDate: e.target.value || null })}
              />
            </Field>
            <Field label="Estimated cost">
              <Input
                type="number"
                step="0.01"
                value={project.estimatedCost ?? ""}
                onChange={(e) =>
                  void updateRepairProject(project.id, { estimatedCost: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Field>
            <Field label="Actual cost">
              <Input
                type="number"
                step="0.01"
                value={project.actualCost ?? ""}
                onChange={(e) =>
                  void updateRepairProject(project.id, { actualCost: e.target.value ? Number(e.target.value) : null })
                }
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                defaultValue={project.description}
                onBlur={(e) => void updateRepairProject(project.id, { description: e.target.value })}
              />
            </Field>
            <Field label="Notes" className="sm:col-span-2">
              <Textarea
                rows={2}
                defaultValue={project.notes}
                onBlur={(e) => void updateRepairProject(project.id, { notes: e.target.value })}
              />
            </Field>
          </div>

          <NoteContextPanel contextType="repairProject" contextId={project.id} title="Notes" />

          <DocumentContextPanel
            documents={documents}
            onAdd={(input) => createDocument({ ...input, relatedRepairProjectId: project.id })}
          />

          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${project.title}"? This cannot be undone.`)) void deleteRepairProject(project.id);
              }}
              className="text-xs text-ink-subtle hover:text-critical"
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
