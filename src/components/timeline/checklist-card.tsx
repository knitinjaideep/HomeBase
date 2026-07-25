"use client";

import { useState } from "react";
import type { Checklist, ChecklistTask, Property } from "@/lib/models";
import { addTask, cloneChecklist, deleteChecklist } from "@/lib/repo";
import { monthLabel } from "@/lib/format";
import { TaskRow } from "./task-row";
import { Input } from "@/components/ui";

export function ChecklistCard({
  checklist,
  tasks,
  properties,
  showClone,
  showDelete,
}: {
  checklist: Checklist;
  tasks: ChecklistTask[];
  properties: Property[];
  showClone?: boolean;
  showDelete?: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const ordered = [...tasks].sort((a, b) => a.order - b.order || a.createdAt.localeCompare(b.createdAt));
  const doneCount = ordered.filter((t) => t.status === "done").length;

  const phase =
    checklist.phaseStart && checklist.phaseEnd
      ? checklist.phaseStart === checklist.phaseEnd
        ? monthLabel(checklist.phaseStart)
        : `${monthLabel(checklist.phaseStart)} – ${monthLabel(checklist.phaseEnd)}`
      : null;

  const add = async () => {
    const title = newTitle.trim();
    if (!title) return;
    await addTask({ checklistId: checklist.id, title, order: ordered.length });
    setNewTitle("");
  };

  return (
    <div className="rounded-xl border border-line bg-surface p-5">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <h3 className="font-display text-lg text-ink">{checklist.title}</h3>
          {phase && <div className="text-xs text-ink-subtle">{phase}</div>}
          {checklist.description && (
            <p className="mt-1 text-sm text-ink-muted">{checklist.description}</p>
          )}
        </div>
        <span className="shrink-0 text-xs text-ink-subtle">
          {doneCount}/{ordered.length}
        </span>
      </div>

      <ul>
        {ordered.map((task) => (
          <TaskRow key={task.id} task={task} properties={properties} />
        ))}
        {ordered.length === 0 && (
          <li className="py-3 text-sm text-ink-subtle">No tasks yet.</li>
        )}
      </ul>

      <div className="mt-3 flex items-center gap-2 border-t border-line pt-3">
        <Input
          placeholder="Add a task…"
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              void add();
            }
          }}
        />
        <button
          onClick={add}
          className="shrink-0 rounded-lg border border-line px-3 py-2 text-sm text-ink hover:bg-surface-muted"
        >
          Add
        </button>
      </div>

      {(showClone || showDelete) && (
        <div className="mt-3 flex gap-4 text-xs">
          {showClone && (
            <button
              onClick={() => cloneChecklist(checklist.id)}
              className="text-accent hover:underline"
            >
              Duplicate as working copy
            </button>
          )}
          {showDelete && (
            <button
              onClick={() => deleteChecklist(checklist.id)}
              className="text-ink-muted hover:text-critical"
            >
              Delete checklist
            </button>
          )}
        </div>
      )}
    </div>
  );
}
