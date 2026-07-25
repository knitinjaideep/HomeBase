"use client";

import { useState } from "react";
import type { GuideDecision } from "@/lib/guide";
import type { JourneyDecision } from "@/lib/models";
import { saveDecision } from "@/lib/repo";
import { Textarea, Chip } from "@/components/ui";
import { cn } from "@/lib/util";

/**
 * A structured decision. Records the answer and, where the guide asks for it,
 * an explicit sign-off from each spouse — several stages treat "both approve"
 * as a completion criterion.
 */
export function DecisionRow({
  decision,
  stageId,
  record,
  buyer1Name,
  buyer2Name,
}: {
  decision: GuideDecision;
  stageId: string;
  record: JourneyDecision | undefined;
  buyer1Name: string;
  buyer2Name: string;
}) {
  const [answer, setAnswer] = useState(record?.answer ?? "");
  const b1 = record?.buyer1Approved ?? false;
  const b2 = record?.buyer2Approved ?? false;
  const answered = (record?.answer ?? "").trim() !== "";
  const complete = answered && (!decision.requiresBothSpouses || (b1 && b2));

  const persist = (patch: Partial<JourneyDecision>) =>
    void saveDecision(decision.id, stageId, {
      prompt: decision.prompt,
      ...patch,
      decidedAt: patch.answer !== undefined && patch.answer.trim() ? new Date().toISOString() : record?.decidedAt ?? null,
    });

  return (
    <div
      className={cn(
        "rounded-lg border p-3.5",
        complete ? "border-positive/30 bg-positive/[0.04]" : "border-line bg-surface",
      )}
    >
      <div className="flex items-start gap-2">
        <span className="mt-0.5 text-sm text-ink-subtle" aria-hidden>
          {complete ? "✓" : "•"}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink">{decision.prompt}</p>
          {decision.help && <p className="mt-0.5 text-xs text-ink-subtle">{decision.help}</p>}

          {decision.suggestions && decision.suggestions.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {decision.suggestions.map((sugg) => (
                <button
                  key={sugg}
                  type="button"
                  onClick={() => {
                    const next = answer ? `${answer}${answer.endsWith(" ") ? "" : " "}${sugg}` : sugg;
                    setAnswer(next);
                    persist({ answer: next });
                  }}
                >
                  <Chip tone="neutral">{sugg}</Chip>
                </button>
              ))}
            </div>
          )}

          <Textarea
            className="mt-2"
            rows={2}
            value={answer}
            placeholder="Our decision…"
            onChange={(e) => setAnswer(e.target.value)}
            onBlur={(e) => persist({ answer: e.target.value })}
          />

          {decision.requiresBothSpouses && (
            <div className="mt-2 flex flex-wrap gap-2">
              <SignOff
                label={buyer1Name}
                checked={b1}
                onChange={(v) => persist({ buyer1Approved: v })}
              />
              <SignOff
                label={buyer2Name}
                checked={b2}
                onChange={(v) => persist({ buyer2Approved: v })}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SignOff({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors",
        checked
          ? "border-positive/40 bg-positive/12 text-positive"
          : "border-line bg-surface text-ink-muted hover:border-accent/50",
      )}
    >
      <span className={cn("inline-block h-3 w-3 rounded-full border", checked ? "border-positive bg-positive" : "border-ink-subtle")} />
      {label} approves
    </button>
  );
}
