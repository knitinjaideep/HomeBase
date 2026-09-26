"use client";

import { useMemo } from "react";
import Link from "next/link";
import { JOURNEY_STAGES, type JourneyStage } from "@/lib/guide";
import { overallProgress } from "@/lib/journey/progress";
import type { JourneySnapshot } from "@/lib/journey/snapshot";
import { Panel } from "@/components/ui";
import { ActivityList } from "@/components/journey/activity-list";
import { ProgressBar, StatusPill } from "@/components/journey/journey-ui";

/**
 * One of the six Journey Stages, with every activity inside it. The activities
 * can be opened, started, and finished in any order.
 */
export function JourneyStageView({ stage, s }: { stage: JourneyStage; s: JourneySnapshot }) {
  const progress = useMemo(() => overallProgress(s), [s]);
  const sp = progress.stages.find((x) => x.stage.id === stage.id);
  if (!sp) return null;

  const others = JOURNEY_STAGES.filter((x) => x.id !== stage.id);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-4 flex items-center justify-between text-sm">
        <Link href="/journey" className="text-ink-muted hover:text-accent">
          ← Journey
        </Link>
        <span className="text-ink-subtle">
          Stage {stage.order} of {JOURNEY_STAGES.length}
        </span>
      </div>

      <div className="mb-5">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{stage.title}</h1>
          <StatusPill status={sp.status} />
        </div>
        <p className="mt-2 text-sm text-ink-muted">{stage.goal}</p>
        <div className="mt-4">
          <div className="mb-1.5 text-xs text-ink-subtle">
            {sp.activitiesDone} of {sp.activitiesTotal} activities complete
            {sp.activitiesInProgress > 0 && <> · {sp.activitiesInProgress} in progress</>}
          </div>
          <ProgressBar fraction={sp.fraction} tone={sp.status === "completed" ? "positive" : "accent"} />
        </div>
        <p className="mt-3 text-xs text-ink-subtle">
          Work on these in any order — several can be underway at once.
        </p>
      </div>

      <Panel className="overflow-hidden p-0">
        <ActivityList activities={sp.activities} showPurpose />
      </Panel>

      <nav aria-label="Other stages" className="mt-10 border-t border-line pt-6">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Other stages</div>
        <ul className="flex flex-wrap gap-2">
          {others.map((o) => (
            <li key={o.id}>
              <Link
                href={`/journey/${o.id}`}
                className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-line bg-surface px-3 text-sm text-ink hover:border-accent/50 hover:text-accent"
              >
                {o.title}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
