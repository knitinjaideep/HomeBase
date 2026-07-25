"use client";

import { useState } from "react";
import type { ChecklistTask, Owner, Priority, Property, TaskStatus } from "@/lib/models";
import { updateTask, deleteTask } from "@/lib/repo";
import { dateLabel } from "@/lib/format";
import { cn } from "@/lib/util";
import { OWNER_LABELS, PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { Field, Input, Select } from "@/components/ui";

export function TaskRow({
  task,
  properties,
}: {
  task: ChecklistTask;
  properties: Property[];
}) {
  const [open, setOpen] = useState(false);
  const done = task.status === "done";

  const toggleDone = () =>
    updateTask(task.id, { status: done ? "todo" : "done" });

  const related = task.relatedPropertyId
    ? properties.find((p) => p.id === task.relatedPropertyId)
    : undefined;

  return (
    <li className="border-t border-line first:border-t-0">
      <div className="flex items-start gap-3 py-2.5">
        <button
          onClick={toggleDone}
          aria-label={done ? "Mark not done" : "Mark done"}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border",
            done ? "border-accent bg-accent text-white" : "border-line bg-surface hover:border-accent",
          )}
        >
          {done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          )}
        </button>
        <div className="min-w-0 flex-1">
          <button onClick={() => setOpen((o) => !o)} className="block text-left">
            <span className={cn("text-sm", done ? "text-ink-subtle line-through" : "text-ink")}>
              {task.title}
            </span>
          </button>
          <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-ink-subtle">
            <span>{OWNER_LABELS[task.owner]}</span>
            {task.dueDate && <span>{dateLabel(task.dueDate)}</span>}
            {task.priority === "high" && <span className="text-caution">High priority</span>}
            {task.status !== "todo" && task.status !== "done" && (
              <span>{TASK_STATUS_LABELS[task.status]}</span>
            )}
            {related && <span>· {related.address}</span>}
          </div>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          className="shrink-0 text-xs text-ink-muted hover:text-ink"
        >
          {open ? "Close" : "Edit"}
        </button>
      </div>

      {open && (
        <div className="animate-rise grid gap-3 pb-4 pl-8 sm:grid-cols-2">
          <Field label="Status">
            <Select
              value={task.status}
              onChange={(e) => updateTask(task.id, { status: e.target.value as TaskStatus })}
            >
              {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((s) => (
                <option key={s} value={s}>
                  {TASK_STATUS_LABELS[s]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Owner">
            <Select
              value={task.owner}
              onChange={(e) => updateTask(task.id, { owner: e.target.value as Owner })}
            >
              {(Object.keys(OWNER_LABELS) as Owner[]).map((o) => (
                <option key={o} value={o}>
                  {OWNER_LABELS[o]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Priority">
            <Select
              value={task.priority}
              onChange={(e) => updateTask(task.id, { priority: e.target.value as Priority })}
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
              defaultValue={task.dueDate ?? ""}
              onChange={(e) => updateTask(task.id, { dueDate: e.target.value || null })}
            />
          </Field>
          <Field label="Related property" className="sm:col-span-2">
            <Select
              value={task.relatedPropertyId ?? ""}
              onChange={(e) => updateTask(task.id, { relatedPropertyId: e.target.value || null })}
            >
              <option value="">None</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Notes" className="sm:col-span-2">
            <textarea
              rows={2}
              className="hs-input"
              defaultValue={task.notes}
              onBlur={(e) => updateTask(task.id, { notes: e.target.value })}
            />
          </Field>
          <div className="sm:col-span-2">
            <button
              onClick={() => deleteTask(task.id)}
              className="text-xs text-ink-muted hover:text-critical"
            >
              Delete task
            </button>
          </div>
        </div>
      )}
    </li>
  );
}
