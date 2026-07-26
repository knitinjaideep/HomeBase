"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useChecklists, useProperties, useTasks } from "@/lib/hooks";
import { createChecklist } from "@/lib/repo";
import { Button, Field, Input, PageHeader, Panel, Select, Toggle } from "@/components/ui";
import { ChecklistCard } from "@/components/timeline/checklist-card";
import { DocumentIndex } from "@/components/documents/document-index";
import { OWNER_LABELS } from "@/lib/labels";
import type { ChecklistTask, Owner } from "@/lib/models";
import { cn } from "@/lib/util";

type TimelineTab = "timeline" | "checklists" | "documents";

export default function TimelinePage() {
  const checklists = useChecklists();
  const tasks = useTasks();
  const properties = useProperties();
  const searchParams = useSearchParams();
  const initialTab = (searchParams.get("tab") as TimelineTab | null) ?? "timeline";

  const [tab, setTab] = useState<TimelineTab>(initialTab);
  const [ownerFilter, setOwnerFilter] = useState<string>("all");
  const [hideDone, setHideDone] = useState(false);
  const [newChecklist, setNewChecklist] = useState("");

  const tasksByChecklist = useMemo(() => {
    const map = new Map<string, ChecklistTask[]>();
    (tasks ?? []).forEach((t) => {
      if (ownerFilter !== "all" && t.owner !== ownerFilter) return;
      if (hideDone && t.status === "done") return;
      const arr = map.get(t.checklistId) ?? [];
      arr.push(t);
      map.set(t.checklistId, arr);
    });
    return map;
  }, [tasks, ownerFilter, hideDone]);

  if (!checklists || !tasks || !properties) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const timeline = checklists
    .filter((c) => c.kind === "timeline")
    .sort((a, b) => a.order - b.order);
  const templates = checklists
    .filter((c) => c.kind === "template")
    .sort((a, b) => a.order - b.order || a.title.localeCompare(b.title));

  const addChecklist = async () => {
    const title = newChecklist.trim();
    if (!title) return;
    await createChecklist({ title, kind: "template", category: "custom", order: templates.length });
    setNewChecklist("");
  };

  return (
    <div>
      <PageHeader
        title="Timeline, checklists & documents"
        description="Everything in date order, reusable checklists, and a document index."
      />

      {/* Controls */}
      <div className="mb-6 flex flex-wrap items-end gap-3">
        <div className="inline-flex overflow-hidden rounded-lg border border-line">
          {(["timeline", "checklists", "documents"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={cn(
                "px-4 py-2 text-sm font-medium capitalize",
                tab === t ? "bg-accent text-white" : "bg-surface text-ink-muted hover:bg-surface-muted",
              )}
            >
              {t}
            </button>
          ))}
        </div>
        {tab !== "documents" && (
          <>
            <Field label="Owner" className="w-40">
              <Select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)}>
                <option value="all">Everyone</option>
                {(Object.keys(OWNER_LABELS) as Owner[]).map((o) => (
                  <option key={o} value={o}>
                    {OWNER_LABELS[o]}
                  </option>
                ))}
              </Select>
            </Field>
            <div className="pb-2">
              <Toggle checked={hideDone} onChange={setHideDone} label="Hide completed" />
            </div>
          </>
        )}
      </div>

      {tab === "documents" ? (
        <DocumentIndex />
      ) : tab === "timeline" ? (
        <div className="grid gap-5">
          {timeline.map((c) => (
            <ChecklistCard
              key={c.id}
              checklist={c}
              tasks={tasksByChecklist.get(c.id) ?? []}
              properties={properties}
            />
          ))}
        </div>
      ) : (
        <>
          <Panel className="mb-5 flex flex-wrap items-end gap-3 p-4">
            <Field label="New checklist" className="min-w-[14rem] flex-1">
              <Input
                placeholder="e.g. Second-visit checklist"
                value={newChecklist}
                onChange={(e) => setNewChecklist(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addChecklist())}
              />
            </Field>
            <Button onClick={addChecklist}>Add checklist</Button>
          </Panel>
          <div className="grid gap-5 lg:grid-cols-2">
            {templates.map((c) => (
              <ChecklistCard
                key={c.id}
                checklist={c}
                tasks={tasksByChecklist.get(c.id) ?? []}
                properties={properties}
                showClone
                showDelete
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
