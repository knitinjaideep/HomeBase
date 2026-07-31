"use client";

import { useState } from "react";
import { createMaintenanceItem } from "@/lib/maintenance/service";
import { PRIORITY_LABELS } from "@/lib/labels";
import { Panel, Button, Field, Input, Select, Textarea } from "@/components/ui";
import type { Priority } from "@/lib/models";

const RECURRENCE_OPTIONS: { label: string; value: string }[] = [
  { label: "One-time (no repeat)", value: "" },
  { label: "Every month", value: "1" },
  { label: "Every 3 months", value: "3" },
  { label: "Every 6 months", value: "6" },
  { label: "Every 12 months", value: "12" },
];

export function AddMaintenanceItemForm({ onDone }: { onDone: () => void }) {
  const [title, setTitle] = useState("");
  const [areaOrSystem, setAreaOrSystem] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<Priority>("medium");
  const [dueDate, setDueDate] = useState("");
  const [recurrenceMonths, setRecurrenceMonths] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createMaintenanceItem({
        title: title.trim(),
        areaOrSystem: areaOrSystem.trim(),
        description: description.trim(),
        priority,
        dueDate: dueDate || null,
        recurrenceMonths: recurrenceMonths ? Number(recurrenceMonths) : null,
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
          <Input value={title} onChange={(e) => setTitle(e.target.value)} autoFocus placeholder="e.g. Replace HVAC filter" />
        </Field>
        <Field label="Area or system (optional)">
          <Input value={areaOrSystem} onChange={(e) => setAreaOrSystem(e.target.value)} placeholder="e.g. HVAC, Roof, Plumbing" />
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
        <Field label="Due date (optional)">
          <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
        </Field>
        <Field label="Repeats (optional)" className="sm:col-span-2">
          <Select value={recurrenceMonths} onChange={(e) => setRecurrenceMonths(e.target.value)}>
            {RECURRENCE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Description (optional)" className="sm:col-span-2">
          <Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Adding…" : "Add maintenance item"}
        </Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
