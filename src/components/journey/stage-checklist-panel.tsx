"use client";

import { useState } from "react";
import type { Checklist, ChecklistTask, Property } from "@/lib/models";
import { addTask } from "@/lib/repo";
import { ensureStageChecklist } from "@/lib/journey/custom-checklist";
import { ChecklistCard } from "@/components/timeline/checklist-card";
import { Input } from "@/components/ui";

/**
 * The household's own checklist items for one journey stage — anything not
 * covered by the guide above. Bootstraps a stage-scoped checklist on the
 * first item, then hands off to the same `ChecklistCard` the Timeline page
 * uses (add/complete/status/owner/due-date/notes, already built).
 */
export function StageChecklistPanel({
  stageId,
  stageTitle,
  checklist,
  tasks,
  properties,
}: {
  stageId: string;
  stageTitle: string;
  checklist: Checklist | undefined;
  tasks: ChecklistTask[];
  properties: Property[];
}) {
  const [draft, setDraft] = useState("");

  if (checklist) {
    return <ChecklistCard checklist={checklist} tasks={tasks} properties={properties} />;
  }

  const addFirst = async () => {
    const title = draft.trim();
    if (!title) return;
    const created = await ensureStageChecklist(stageId, stageTitle);
    await addTask({ checklistId: created.id, title, order: 0 });
    setDraft("");
  };

  return (
    <div className="rounded-xl border border-dashed border-line bg-surface p-4">
      <Input
        placeholder="Add your own item…"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            void addFirst();
          }
        }}
      />
    </div>
  );
}
