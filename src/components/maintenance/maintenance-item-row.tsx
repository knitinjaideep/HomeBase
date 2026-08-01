"use client";

import { useState } from "react";
import {
  completeMaintenanceItem,
  deleteMaintenanceItem,
  skipMaintenanceItem,
  updateMaintenanceItem,
} from "@/lib/maintenance/service";
import { getMaintenanceUrgency } from "@/lib/maintenance/schedule";
import { useDocumentsForMaintenanceItem } from "@/lib/hooks";
import { createDocument } from "@/lib/repo";
import { dateLabel, money } from "@/lib/format";
import { MAINTENANCE_URGENCY_LABELS, PRIORITY_LABELS } from "@/lib/labels";
import { useToast } from "@/components/toast";
import { Field, Input, Select, Textarea, Button } from "@/components/ui";
import { NoteContextPanel } from "@/components/notes/note-context-panel";
import { DocumentContextPanel } from "@/components/documents/document-context-panel";
import { cn } from "@/lib/util";
import type { MaintenanceItem, Priority } from "@/lib/models";

const URGENCY_STYLES = {
  overdue: "bg-critical/12 text-critical",
  "due-soon": "bg-caution/15 text-caution",
  upcoming: "bg-surface-muted text-ink-muted",
  "no-date": "bg-surface-muted text-ink-subtle",
} as const;

export function MaintenanceItemRow({ item, defaultOpen = false }: { item: MaintenanceItem; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  const [showComplete, setShowComplete] = useState(false);
  const documents = useDocumentsForMaintenanceItem(item.id);
  const { notify } = useToast();

  const urgency = getMaintenanceUrgency(item.dueDate);
  const isActive = item.status === "active";

  return (
    <li id={`maintenance-item-${item.id}`} className="border-t border-line first:border-t-0">
      <div className="flex flex-wrap items-start justify-between gap-3 py-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 flex-1 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className={cn("text-sm font-medium", item.status !== "active" ? "text-ink-subtle" : "text-ink")}>
              {item.title}
            </span>
            {item.priority === "high" && <span className="text-xs text-caution">High priority</span>}
            {item.status === "active" && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", URGENCY_STYLES[urgency])}>
                {MAINTENANCE_URGENCY_LABELS[urgency]}
              </span>
            )}
            {item.status !== "active" && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                {item.status === "completed" ? "Completed" : item.status === "skipped" ? "Skipped" : "Archived"}
              </span>
            )}
          </div>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-subtle">
            {item.areaOrSystem && <span>{item.areaOrSystem}</span>}
            {item.dueDate && <span>Due {dateLabel(item.dueDate)}</span>}
            {item.recurrenceMonths && <span>Every {item.recurrenceMonths}mo</span>}
            {item.lastCompletedDate && <span>Last done {dateLabel(item.lastCompletedDate)}</span>}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          {isActive && (
            <>
              <Button size="sm" onClick={() => setShowComplete((s) => !s)}>
                Complete
              </Button>
              <Button variant="secondary" size="sm" onClick={() => void skipMaintenanceItem(item.id)}>
                Skip
              </Button>
            </>
          )}
          <button type="button" onClick={() => setOpen((o) => !o)} className="text-xs text-ink-muted hover:text-ink">
            {open ? "Close" : "Details"}
          </button>
        </div>
      </div>

      {showComplete && (
        <CompletionForm
          item={item}
          onDone={() => {
            setShowComplete(false);
            notify("Maintenance recorded.");
          }}
          onCancel={() => setShowComplete(false)}
        />
      )}

      {open && (
        <div className="animate-rise space-y-4 pb-5">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Title">
              <Input defaultValue={item.title} onBlur={(e) => void updateMaintenanceItem(item.id, { title: e.target.value })} />
            </Field>
            <Field label="Area or system">
              <Input
                defaultValue={item.areaOrSystem}
                onBlur={(e) => void updateMaintenanceItem(item.id, { areaOrSystem: e.target.value })}
              />
            </Field>
            <Field label="Priority">
              <Select
                value={item.priority}
                onChange={(e) => void updateMaintenanceItem(item.id, { priority: e.target.value as Priority })}
              >
                {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
                  <option key={p} value={p}>
                    {PRIORITY_LABELS[p]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input
                type="date"
                value={item.dueDate ?? ""}
                onChange={(e) => void updateMaintenanceItem(item.id, { dueDate: e.target.value || null })}
              />
            </Field>
            <Field label="Repeats every N months (blank = one-time)">
              <Input
                type="number"
                min={1}
                value={item.recurrenceMonths ?? ""}
                onChange={(e) =>
                  void updateMaintenanceItem(item.id, {
                    recurrenceMonths: e.target.value ? Number(e.target.value) : null,
                  })
                }
              />
            </Field>
            <Field label="Description" className="sm:col-span-2">
              <Textarea
                rows={2}
                defaultValue={item.description}
                onBlur={(e) => void updateMaintenanceItem(item.id, { description: e.target.value })}
              />
            </Field>
          </div>

          {item.completionHistory.length > 0 && (
            <div>
              <div className="mb-1.5 text-sm font-medium text-ink">Completion history</div>
              <ul className="space-y-1.5">
                {item.completionHistory
                  .slice()
                  .reverse()
                  .map((c) => (
                    <li key={c.id} className="rounded-lg border border-line px-3 py-2 text-xs text-ink-muted">
                      <span className="font-medium text-ink">{dateLabel(c.completedDate)}</span>
                      {c.whatWasDone && <> — {c.whatWasDone}</>}
                      {c.cost !== null && <> · {money(c.cost)}</>}
                      {c.performedBy && <> · {c.performedBy}</>}
                    </li>
                  ))}
              </ul>
            </div>
          )}

          <NoteContextPanel contextType="maintenanceItem" contextId={item.id} title="Notes" />

          <DocumentContextPanel
            documents={documents}
            onAdd={async (input) => {
              await createDocument({ ...input, relatedMaintenanceItemId: item.id });
            }}
          />

          <div className="flex justify-end gap-3">
            {item.status !== "archived" && (
              <button
                type="button"
                onClick={() => void updateMaintenanceItem(item.id, { status: "archived" })}
                className="text-xs text-ink-subtle hover:text-ink"
              >
                Archive
              </button>
            )}
            <button
              type="button"
              onClick={() => {
                if (confirm(`Delete "${item.title}"? This cannot be undone.`)) void deleteMaintenanceItem(item.id);
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

function CompletionForm({ item, onDone, onCancel }: { item: MaintenanceItem; onDone: () => void; onCancel: () => void }) {
  const today = new Date().toISOString().slice(0, 10);
  const [completedDate, setCompletedDate] = useState(today);
  const [whatWasDone, setWhatWasDone] = useState("");
  const [cost, setCost] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    setBusy(true);
    try {
      await completeMaintenanceItem(item.id, {
        completedDate,
        whatWasDone: whatWasDone.trim(),
        cost: cost ? Number(cost) : null,
        performedBy: performedBy.trim(),
        note: note.trim(),
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-3 rounded-lg border border-line bg-surface-muted p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Completed on">
          <Input type="date" value={completedDate} onChange={(e) => setCompletedDate(e.target.value)} />
        </Field>
        <Field label="Cost (optional)">
          <Input type="number" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} placeholder="$" />
        </Field>
        <Field label="Who performed the work (optional)">
          <Input value={performedBy} onChange={(e) => setPerformedBy(e.target.value)} placeholder="Me, a contractor, etc." />
        </Field>
        <Field label="What was done">
          <Input value={whatWasDone} onChange={(e) => setWhatWasDone(e.target.value)} placeholder="Brief summary" />
        </Field>
        <Field label="Note (optional)" className="sm:col-span-2">
          <Textarea
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything worth remembering — saved as a note linked to this item."
          />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button size="sm" onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Save completion"}
        </Button>
        <Button variant="secondary" size="sm" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </div>
  );
}
