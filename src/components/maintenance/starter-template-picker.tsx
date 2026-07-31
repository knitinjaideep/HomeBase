"use client";

import { useState } from "react";
import { createMaintenanceItem } from "@/lib/maintenance/service";
import { templatesForPropertyType } from "@/lib/maintenance/starter-templates";
import { useOwnerModeProfile } from "@/lib/workspace/hooks";
import { Panel, Button, Callout } from "@/components/ui";

/**
 * An optional starter checklist — nothing is added automatically. The
 * homeowner reviews the list (already filtered for condo/townhouse homes,
 * since an HOA typically handles gutters/exterior) and picks which items
 * apply before anything is created.
 */
export function StarterTemplatePicker({ onDone }: { onDone: () => void }) {
  const ownerProfile = useOwnerModeProfile();
  const templates = templatesForPropertyType(ownerProfile?.propertyType);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);

  const toggle = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const addSelected = async () => {
    if (selected.size === 0) return onDone();
    setBusy(true);
    try {
      const today = new Date().toISOString().slice(0, 10);
      const chosen = templates.filter((t) => selected.has(t.id));
      for (const t of chosen) {
        await createMaintenanceItem({
          title: t.title,
          areaOrSystem: t.areaOrSystem,
          recurrenceMonths: t.recurrenceMonths,
          dueDate: today,
        });
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-4 p-4 sm:p-5">
      <h3 className="font-display text-base text-ink">Starter checklist</h3>
      <p className="mt-1 text-sm text-ink-muted">
        Common home maintenance items — check the ones that apply to your home. Nothing is added until you choose.
      </p>
      {ownerProfile?.propertyType === "condo-townhouse" && (
        <Callout tone="neutral" className="mt-3">
          Items typically handled by an HOA (gutters, exterior inspection) are already left off this list.
        </Callout>
      )}
      <div className="mt-4 space-y-2">
        {templates.map((t) => (
          <label
            key={t.id}
            className="flex cursor-pointer items-center gap-3 rounded-lg border border-line px-3 py-2 hover:bg-surface-muted"
          >
            <input
              type="checkbox"
              checked={selected.has(t.id)}
              onChange={() => toggle(t.id)}
              className="h-4 w-4 rounded border-line"
            />
            <div>
              <div className="text-sm text-ink">{t.title}</div>
              <div className="text-xs text-ink-subtle">
                {t.areaOrSystem} · every {t.recurrenceMonths} month{t.recurrenceMonths === 1 ? "" : "s"}
              </div>
            </div>
          </label>
        ))}
      </div>
      <div className="mt-4 flex gap-2">
        <Button onClick={addSelected} disabled={busy}>
          {busy ? "Adding…" : selected.size > 0 ? `Add ${selected.size} selected` : "Close"}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
