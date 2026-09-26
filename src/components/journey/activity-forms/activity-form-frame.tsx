"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { stageForActivity, type GuideActivity } from "@/lib/guide";
import { overallProgress, recommendedActivity } from "@/lib/journey/progress";
import { setStageState } from "@/lib/repo";
import { OWNER_LABELS } from "@/lib/labels";
import { ownerSchema, type Owner } from "@/lib/models";
import type { JourneySnapshot } from "@/lib/journey/snapshot";
import { Button, Field, Input, Panel, Select } from "@/components/ui";
import { NoteContextPanel } from "@/components/notes/note-context-panel";

/**
 * The shared shell around every structured activity form: the activity's own
 * fields (children), optional owner and due date, the notes section, and the
 * "Save for later" / "Save and continue" footer.
 *
 * A form supplies `onSave`, which writes its own answers and throws on failure.
 * The frame then saves owner/due date (only if changed), and navigates:
 *   - Save for later     → back to the parent Stage
 *   - Save and continue  → the next recommended activity in the Stage (else the Stage)
 * Errors are shown inline and keep the household on the page with their input.
 */
export function ActivityFormFrame({
  activity,
  s,
  onSave,
  children,
}: {
  activity: GuideActivity;
  s: JourneySnapshot;
  onSave: () => Promise<void>;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const stage = stageForActivity(activity.id);
  const stored = s.stageStates.find((x) => x.id === activity.id);
  const [owner, setOwner] = useState<Owner>(stored?.owner ?? "both");
  const [targetDate, setTargetDate] = useState<string>(stored?.targetDate ?? "");
  const [busy, setBusy] = useState<"later" | "continue" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const next = useMemo(() => {
    const sp = overallProgress(s).stages.find((x) => x.stage.id === stage.id);
    if (!sp) return undefined;
    return recommendedActivity({ ...sp, activities: sp.activities.filter((ap) => ap.activity.id !== activity.id) });
  }, [s, stage.id, activity.id]);

  async function save(mode: "later" | "continue") {
    setBusy(mode);
    setError(null);
    try {
      await onSave();
      const patch: { owner?: Owner; targetDate?: string | null } = {};
      if (owner !== (stored?.owner ?? "both")) patch.owner = owner;
      if (targetDate !== (stored?.targetDate ?? "")) patch.targetDate = targetDate || null;
      if (Object.keys(patch).length > 0) await setStageState(activity.id, patch);
      router.push(mode === "continue" && next ? `/journey/${next.activity.id}` : `/journey/${stage.id}`);
    } catch (err) {
      console.error(`Saving activity "${activity.id}" failed`, err);
      setError("Couldn't save your changes. Please try again.");
      setBusy(null);
    }
  }

  return (
    <div className="space-y-6">
      <Panel className="p-4 sm:p-5">
        <div className="space-y-5">{children}</div>

        <details className="mt-5 border-t border-line pt-4">
          <summary className="cursor-pointer text-sm text-ink-muted hover:text-ink">Owner and due date (optional)</summary>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <Field label="Owner">
              <Select value={owner} onChange={(e) => setOwner(ownerSchema.parse(e.target.value))}>
                {ownerSchema.options.map((o) => (
                  <option key={o} value={o}>
                    {OWNER_LABELS[o]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Due date">
              <Input type="date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
            </Field>
          </div>
        </details>
      </Panel>

      <NoteContextPanel contextType="journeyStage" contextId={activity.id} title="Notes about this activity" />

      {error && (
        <p role="alert" className="text-sm text-critical">
          {error}
        </p>
      )}
      <div className="flex flex-wrap gap-3">
        <Button variant="secondary" disabled={busy !== null} onClick={() => void save("later")}>
          {busy === "later" ? "Saving…" : "Save for later"}
        </Button>
        <Button disabled={busy !== null} withArrow onClick={() => void save("continue")}>
          {busy === "continue" ? "Saving…" : "Save and continue"}
        </Button>
      </div>
    </div>
  );
}
