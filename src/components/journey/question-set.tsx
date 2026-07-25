"use client";

import type { GuideQuestionSet } from "@/lib/guide";

/**
 * A read-only display of a question set to take into a conversation with a
 * lender, agent, attorney, or inspector — or to answer together. Answers for a
 * specific professional are captured on that professional's record; here the
 * questions serve as the prompt sheet.
 */
export function QuestionSetView({ set }: { set: GuideQuestionSet }) {
  return (
    <div className="rounded-lg border border-line bg-surface p-4">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-medium text-ink">{set.title}</h3>
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] capitalize text-ink-subtle">
          {audienceLabel(set.audience)}
        </span>
      </div>
      {set.intro && <p className="mt-1 text-xs text-ink-subtle">{set.intro}</p>}
      <ol className="mt-3 space-y-2.5">
        {set.questions.map((q, i) => (
          <li key={q.id} className="flex gap-2.5 text-sm">
            <span className="shrink-0 font-display text-ink-subtle">{i + 1}.</span>
            <div>
              <p className="text-ink">{q.question}</p>
              {q.listenFor && (
                <p className="mt-0.5 text-xs text-ink-subtle">
                  <span className="font-medium">Listen for: </span>
                  {q.listenFor}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

function audienceLabel(audience: GuideQuestionSet["audience"]): string {
  switch (audience) {
    case "ourselves":
      return "Ask together";
    case "lender":
      return "For the lender";
    case "agent":
      return "For the agent";
    case "attorney":
      return "For the attorney";
    case "inspector":
      return "For the inspector";
    case "insurance":
      return "For insurance";
    default:
      return "Reference";
  }
}
