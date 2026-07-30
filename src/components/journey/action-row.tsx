"use client";

import { useState } from "react";
import { cn } from "@/lib/util";
import type { GuideAction } from "@/lib/guide";
import type { JourneyActionState, JourneyStatus, Owner } from "@/lib/models";
import { JOURNEY_STATUS_LABELS, OWNER_LABELS } from "@/lib/labels";
import { cycleActionStatus, setActionState } from "@/lib/repo";
import { Select, Textarea, Input } from "@/components/ui";
import { dateLabel } from "@/lib/format";

const SETTLED: JourneyStatus[] = ["completed", "not-applicable"];

/**
 * One action, with a checkbox that cycles not-started → in-progress →
 * completed, plus an expandable detail area for owner, due date, status,
 * notes, and an attachment reference. Everything persists immediately.
 */
export function ActionRow({
  action,
  stageId,
  state,
  emphasize = false,
  quickSkipLabel,
}: {
  action: GuideAction;
  stageId: string;
  state: JourneyActionState | undefined;
  /** First-time buyers: prominent styling, detail area open by default. */
  emphasize?: boolean;
  /** Repeat buyers: a one-click "not applicable" affordance shown while not-started. */
  quickSkipLabel?: string;
}) {
  const [open, setOpen] = useState(emphasize);
  const status = state?.status ?? "not-started";
  const done = SETTLED.includes(status);

  return (
    <div
      className={cn(
        "rounded-lg border p-3",
        done
          ? "border-line bg-surface-muted/40"
          : emphasize
            ? "border-[color:var(--mode-accent-border)] bg-mode-accent-muted/40"
            : "border-line bg-surface",
      )}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark "${action.title}" complete`}
          onClick={() => void cycleActionStatus(action.id, stageId, status)}
          className={cn(
            "mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded border transition-colors",
            status === "completed"
              ? "border-positive bg-positive text-white"
              : status === "in-progress"
                ? "border-accent bg-accent-soft text-accent"
                : "border-line bg-surface hover:border-accent/60",
          )}
        >
          {status === "completed" ? (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <path d="M20 6 9 17l-5-5" />
            </svg>
          ) : status === "in-progress" ? (
            <span className="h-1.5 w-1.5 rounded-full bg-current" />
          ) : null}
        </button>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="text-left"
            >
              <span className={cn("text-sm font-medium", done ? "text-ink-muted line-through" : "text-ink")}>
                {action.title}
              </span>
            </button>
            <div className="flex shrink-0 items-center gap-2">
              {emphasize && !done && (
                <span className="rounded-full bg-mode-accent px-2 py-0.5 text-[11px] font-medium text-white">
                  Start here
                </span>
              )}
              {state?.owner && state.owner !== "both" && (
                <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-ink-subtle">
                  {OWNER_LABELS[state.owner]}
                </span>
              )}
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="text-xs text-ink-subtle hover:text-ink"
                aria-expanded={open}
              >
                {open ? "Less" : "Details"}
              </button>
            </div>
          </div>
          <p className="mt-0.5 text-xs text-ink-subtle">{action.why}</p>
          {state?.dueDate && !open && (
            <p className="mt-1 text-[11px] text-caution">Due {dateLabel(state.dueDate)}</p>
          )}
          {quickSkipLabel && status === "not-started" && (
            <button
              type="button"
              onClick={() => void setActionState(action.id, stageId, { status: "not-applicable" })}
              className="mt-1 text-xs text-accent hover:underline"
            >
              {quickSkipLabel}
            </button>
          )}
        </div>
      </div>

      {open && (
        <div className="mt-3 space-y-3 border-t border-line pt-3 pl-8">
          {action.whatToGather && (
            <p className="text-xs text-ink-muted">
              <span className="font-medium text-ink-subtle">What to gather: </span>
              {action.whatToGather}
            </p>
          )}
          {action.completionCriteria && (
            <p className="text-xs text-ink-muted">
              <span className="font-medium text-ink-subtle">Done when: </span>
              {action.completionCriteria}
            </p>
          )}
          {action.conditional && (
            <p className="text-xs italic text-ink-subtle">{action.conditional}</p>
          )}

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-subtle">Status</span>
              <Select
                value={status}
                onChange={(e) => void setActionState(action.id, stageId, { status: e.target.value as JourneyStatus })}
              >
                {(Object.keys(JOURNEY_STATUS_LABELS) as JourneyStatus[]).map((st) => (
                  <option key={st} value={st}>
                    {JOURNEY_STATUS_LABELS[st]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-subtle">Owner</span>
              <Select
                value={state?.owner ?? action.defaultOwner}
                onChange={(e) => void setActionState(action.id, stageId, { owner: e.target.value as Owner })}
              >
                {(Object.keys(OWNER_LABELS) as Owner[]).map((o) => (
                  <option key={o} value={o}>
                    {OWNER_LABELS[o]}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-subtle">Due date</span>
              <Input
                type="date"
                value={state?.dueDate ?? ""}
                onChange={(e) => void setActionState(action.id, stageId, { dueDate: e.target.value || null })}
              />
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-subtle">Notes</span>
            <Textarea
              rows={2}
              defaultValue={state?.notes ?? ""}
              placeholder="Anything worth remembering about this step…"
              onBlur={(e) => void setActionState(action.id, stageId, { notes: e.target.value })}
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-subtle">
              Attachment reference (a note, not an upload)
            </span>
            <Input
              defaultValue={state?.attachmentNote ?? ""}
              placeholder="e.g. saved in the mortgage folder / emailed to lender"
              onBlur={(e) => void setActionState(action.id, stageId, { attachmentNote: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
