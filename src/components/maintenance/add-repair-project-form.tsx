"use client";

import { useState } from "react";
import { createRepairProject } from "@/lib/maintenance/service";
import { PRIORITY_LABELS } from "@/lib/labels";
import { Panel, Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Priority } from "@/lib/models";

export function AddRepairProjectForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [startDate, setStartDate] = useState("");
  const [estimatedCost, setEstimatedCost] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createRepairProject({
        title: title.trim(),
        description: description.trim(),
        priority,
        startDate: startDate || null,
        estimatedCost: estimatedCost ? Number(estimatedCost) : null,
      });
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-4 p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Title">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Repaint exterior trim" />
        </Field>
        <Field label="Priority">
          <Select value={priority} onChange={(e) => setPriority(e.target.value as Priority)}>
            {(Object.keys(PRIORITY_LABELS) as Priority[]).map((p) => (
              <option key={p} value={p}>
                {PRIORITY_LABELS[p]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Start date (optional)">
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </Field>
        <Field label="Estimated cost (optional)">
          <Input type="number" step="0.01" value={estimatedCost} onChange={(e) => setEstimatedCost(e.target.value)} placeholder="$" />
        </Field>
        <Field label="Description (optional)" className="sm:col-span-2">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Adding…" : "Add repair / project"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
