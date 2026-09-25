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

type TaskCategoryConfig = {
  label: string;
  focusLabel: string;
  focusOptions: string[];
  decisionLabel: string;
  decisionOptions: string[];
  evidenceLabel: string;
  evidenceOptions: string[];
};

const DEFAULT_TASK_CONFIG: TaskCategoryConfig = {
  label: "Guide task",
  focusLabel: "Current focus",
  focusOptions: ["Read", "Compare", "Confirm", "Record"],
  decisionLabel: "Next selection",
  decisionOptions: ["Need both to review", "Waiting on someone", "Ready to lock", "Not needed"],
  evidenceLabel: "Reference",
  evidenceOptions: ["Not tracked", "Saved in app", "External folder", "Sent by email"],
};

const TASK_CONFIG_BY_STAGE: Record<string, TaskCategoryConfig> = {
  strategy: {
    label: "Strategy",
    focusLabel: "Choice area",
    focusOptions: ["Process", "Timeline", "Towns", "Must-haves", "Budget guardrail"],
    decisionLabel: "Agreement level",
    decisionOptions: ["Discussing", "One of us aligned", "Both aligned", "Needs revisit"],
    evidenceLabel: "Where captured",
    evidenceOptions: ["Settings", "Town research", "Budget tool", "Shared note", "Not captured yet"],
  },
  finances: {
    label: "Money",
    focusLabel: "Money area",
    focusOptions: ["Income", "Savings", "Credit", "Debt", "Monthly payment"],
    decisionLabel: "Comfort level",
    decisionOptions: ["Unknown", "Comfortable", "Stretching", "Do not exceed"],
    evidenceLabel: "Source checked",
    evidenceOptions: ["Bank balance", "Credit report", "Budget worksheet", "Paystub", "Not checked yet"],
  },
  attending: {
    label: "Income transition",
    focusLabel: "Transition area",
    focusOptions: ["Job search", "Contract", "Start date", "Credentialing", "Lender treatment"],
    decisionLabel: "Confidence",
    decisionOptions: ["Unclear", "Likely", "Confirmed verbally", "Confirmed in writing"],
    evidenceLabel: "Proof",
    evidenceOptions: ["Offer details", "Signed contract", "Lender email", "Credentialing note", "Not available"],
  },
  "mortgage-options": {
    label: "Mortgage",
    focusLabel: "Loan topic",
    focusOptions: ["Loan type", "Rate", "Points", "Down payment", "Cash needed"],
    decisionLabel: "Preference",
    decisionOptions: ["Still comparing", "Preferred", "Backup option", "Rejected"],
    evidenceLabel: "Quote status",
    evidenceOptions: ["No quote", "Verbal quote", "Written quote", "Scenario saved"],
  },
  "lender-interviews": {
    label: "Lenders",
    focusLabel: "Interview area",
    focusOptions: ["Candidate list", "Rate quote", "Income treatment", "Responsiveness", "Fees"],
    decisionLabel: "Shortlist status",
    decisionOptions: ["Not reviewed", "Maybe", "Shortlisted", "Remove"],
    evidenceLabel: "Record",
    evidenceOptions: ["Interview notes", "Written quote", "Email thread", "Lender profile", "Not recorded"],
  },
  preapproval: {
    label: "Approval",
    focusLabel: "Approval item",
    focusOptions: ["Documents", "Credit pull", "Preapproval letter", "Conditions", "Expiration"],
    decisionLabel: "Readiness",
    decisionOptions: ["Missing items", "Submitted", "Approved", "Needs update"],
    evidenceLabel: "File location",
    evidenceOptions: ["Documents", "Lender portal", "Email", "Not saved"],
  },
  "agent-selection": {
    label: "Agent",
    focusLabel: "Candidate area",
    focusOptions: ["Referral", "License", "Town experience", "Interview", "Agreement"],
    decisionLabel: "Candidate status",
    decisionOptions: ["New", "Interviewing", "Strong fit", "Weak fit", "Selected"],
    evidenceLabel: "Record",
    evidenceOptions: ["Professional profile", "Scorecard", "Agreement", "Reference call", "Not recorded"],
  },
  "professional-team": {
    label: "Team",
    focusLabel: "Role",
    focusOptions: ["Attorney", "Inspector", "Insurance", "Contractor", "Backup contact"],
    decisionLabel: "Hiring status",
    decisionOptions: ["Need candidates", "Interviewing", "Selected", "Backup only"],
    evidenceLabel: "Record",
    evidenceOptions: ["Professional profile", "Fee quote", "Engagement letter", "Email", "Not recorded"],
  },
  "town-research": {
    label: "Towns",
    focusLabel: "Research area",
    focusOptions: ["Schools", "Commute", "Taxes", "Inventory", "Lifestyle"],
    decisionLabel: "Town fit",
    decisionOptions: ["Unknown", "Primary", "Backup", "Watch only", "Remove"],
    evidenceLabel: "Checked in",
    evidenceOptions: ["Town profile", "School lookup", "Commute test", "Listing history", "Not checked"],
  },
  "active-search": {
    label: "Search",
    focusLabel: "Search setup",
    focusOptions: ["Saved search", "Alerts", "Filters", "Tour list", "Market watch"],
    decisionLabel: "Signal quality",
    decisionOptions: ["Too broad", "Too narrow", "Good", "Needs refresh"],
    evidenceLabel: "Where tracked",
    evidenceOptions: ["Homes page", "Agent portal", "Listing alert", "Shared note", "Not tracked"],
  },
  touring: {
    label: "Touring",
    focusLabel: "Tour focus",
    focusOptions: ["Layout", "Condition", "Neighborhood", "Commute", "Deal risk"],
    decisionLabel: "Interest level",
    decisionOptions: ["Pass", "Maybe", "Strong interest", "Offer candidate"],
    evidenceLabel: "Captured as",
    evidenceOptions: ["Home note", "Photos", "Agent feedback", "Disclosure", "Not captured"],
  },
  "offer-prep": {
    label: "Offer",
    focusLabel: "Offer check",
    focusOptions: ["Schools", "Taxes", "Comps", "Payment", "Walk-away price"],
    decisionLabel: "Offer posture",
    decisionOptions: ["Do not offer", "Needs more info", "Offer-ready", "Both approve"],
    evidenceLabel: "Verified by",
    evidenceOptions: ["Agent", "Lender", "Attorney", "Public record", "Not verified"],
  },
  negotiation: {
    label: "Negotiation",
    focusLabel: "Negotiation item",
    focusOptions: ["Price", "Terms", "Credits", "Timeline", "Contingency"],
    decisionLabel: "Position",
    decisionOptions: ["Hold", "Counter", "Accept", "Walk away"],
    evidenceLabel: "Basis",
    evidenceOptions: ["Comps", "Inspection item", "Lender constraint", "Attorney advice", "Not documented"],
  },
  "attorney-review": {
    label: "Attorney review",
    focusLabel: "Review area",
    focusOptions: ["Contract", "Riders", "Deadlines", "Disclosures", "Contingencies"],
    decisionLabel: "Legal status",
    decisionOptions: ["Awaiting review", "Change requested", "Accepted", "Escalate"],
    evidenceLabel: "Record",
    evidenceOptions: ["Attorney email", "Contract version", "Signed addendum", "Not saved"],
  },
  inspections: {
    label: "Inspections",
    focusLabel: "Inspection area",
    focusOptions: ["General", "Sewer", "Radon", "Oil tank", "Specialist"],
    decisionLabel: "Issue level",
    decisionOptions: ["None", "Monitor", "Negotiate", "Deal risk"],
    evidenceLabel: "Report status",
    evidenceOptions: ["Scheduled", "Report received", "Quote requested", "Credit requested", "Not scheduled"],
  },
  financing: {
    label: "Financing",
    focusLabel: "Loan item",
    focusOptions: ["Application", "Rate lock", "Appraisal", "Conditions", "Clear to close"],
    decisionLabel: "Loan status",
    decisionOptions: ["Pending", "Submitted", "Conditioned", "Cleared", "Blocked"],
    evidenceLabel: "Source",
    evidenceOptions: ["Lender portal", "Loan estimate", "Appraisal", "Email", "Not saved"],
  },
  "closing-prep": {
    label: "Closing prep",
    focusLabel: "Prep area",
    focusOptions: ["Insurance", "Utilities", "Wire instructions", "Final walkthrough", "Move plan"],
    decisionLabel: "Ready state",
    decisionOptions: ["Not started", "In motion", "Ready", "Needs attention"],
    evidenceLabel: "Confirmed by",
    evidenceOptions: ["Attorney", "Lender", "Agent", "Utility provider", "Not confirmed"],
  },
  closing: {
    label: "Closing",
    focusLabel: "Closing item",
    focusOptions: ["Documents", "Funds", "Keys", "Recording", "Post-close"],
    decisionLabel: "Completion",
    decisionOptions: ["Pending", "Signed", "Funded", "Done", "Follow-up"],
    evidenceLabel: "Record",
    evidenceOptions: ["Closing package", "Wire receipt", "Deed/recording", "Key handoff", "Not saved"],
  },
};

function configForStage(stageId: string): TaskCategoryConfig {
  return TASK_CONFIG_BY_STAGE[stageId] ?? DEFAULT_TASK_CONFIG;
}

type PersistedTaskSelections = {
  focus?: string;
  decision?: string;
  evidence?: string;
};

function readTaskSelections(attachmentNote: string | undefined, legacyNotes: string | undefined): PersistedTaskSelections {
  for (const value of [attachmentNote, legacyNotes]) {
    if (!value) continue;
    try {
      const parsed = JSON.parse(value) as PersistedTaskSelections;
      if (parsed && typeof parsed === "object") return parsed;
    } catch {
      continue;
    }
  }
  return attachmentNote ? { evidence: attachmentNote } : {};
}

function writeTaskSelections(selections: PersistedTaskSelections) {
  return JSON.stringify(selections);
}

function readNotes(notes: string | undefined) {
  if (!notes) return "";
  try {
    const parsed = JSON.parse(notes) as PersistedTaskSelections;
    if (parsed && typeof parsed === "object" && (parsed.focus || parsed.decision || parsed.evidence)) return "";
  } catch {
    return notes;
  }
  return notes;
}

function selectValue(value: string | undefined, options: string[]) {
  return value && options.includes(value) ? value : options[0];
}

/**
 * One action, with a checkbox that cycles not-started → in-progress →
 * completed, plus an expandable detail area for owner, due date, status,
 * and stage-specific selections. Everything persists immediately.
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
  const category = configForStage(stageId);
  const selections = readTaskSelections(state?.attachmentNote, state?.notes);
  const focusValue = selectValue(selections.focus, category.focusOptions);
  const decisionValue = selectValue(selections.decision, category.decisionOptions);
  const evidenceValue = selectValue(selections.evidence, category.evidenceOptions);
  const notesValue = readNotes(state?.notes);

  return (
    <div
      className={cn(
        "rounded-lg border p-3 shadow-sm shadow-black/5 transition-colors",
        done
          ? "border-line bg-surface-muted/40"
          : emphasize
            ? "border-[color:var(--mode-accent-border)] bg-mode-accent-muted/40"
            : "border-line bg-surface/95 hover:border-accent/35",
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
              <span className="mb-1 flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-line bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-subtle">
                  {category.label}
                </span>
                {!open && selections.focus && (
                  <span className="rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                    {selections.focus}
                  </span>
                )}
              </span>
              <span className={cn("text-sm font-semibold", done ? "text-ink-muted line-through" : "text-ink")}>
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
        <div className="mt-3 space-y-4 border-t border-line pt-3 pl-8">
          {(action.whatToGather || action.completionCriteria || action.conditional) && (
            <div className="rounded-lg border border-line bg-surface-muted/45 p-3">
              {action.whatToGather && (
                <p className="text-xs text-ink-muted">
                  <span className="font-medium text-ink-subtle">Gather: </span>
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
            </div>
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

          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-subtle">{category.focusLabel}</span>
              <Select
                value={focusValue}
                onChange={(e) =>
                  void setActionState(action.id, stageId, {
                    attachmentNote: writeTaskSelections({ ...selections, focus: e.target.value }),
                  })
                }
              >
                {category.focusOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-subtle">{category.decisionLabel}</span>
              <Select
                value={decisionValue}
                onChange={(e) =>
                  void setActionState(action.id, stageId, {
                    attachmentNote: writeTaskSelections({ ...selections, decision: e.target.value }),
                  })
                }
              >
                {category.decisionOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </label>
            <label className="block">
              <span className="mb-1 block text-xs font-medium text-ink-subtle">{category.evidenceLabel}</span>
              <Select
                value={evidenceValue}
                onChange={(e) =>
                  void setActionState(action.id, stageId, {
                    attachmentNote: writeTaskSelections({ ...selections, evidence: e.target.value }),
                  })
                }
              >
                {category.evidenceOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </Select>
            </label>
          </div>

          <label className="block">
            <span className="mb-1 block text-xs font-medium text-ink-subtle">Notes</span>
            <Textarea
              rows={2}
              defaultValue={notesValue}
              placeholder="Anything worth remembering about this step..."
              onBlur={(e) => void setActionState(action.id, stageId, { notes: e.target.value })}
            />
          </label>
        </div>
      )}
    </div>
  );
}
