"use client";

import { useMemo } from "react";
import type { JourneyStage } from "@/lib/guide";
import { overallProgress, recommendedActivity } from "@/lib/journey/progress";
import { FACT_ACTIVITY_IDS, activitySummaries, factsForStage, journeyFacts } from "@/lib/journey/facts";
import type { JourneySnapshot } from "@/lib/journey/snapshot";
import { JourneyHero } from "@/components/journey/journey-hero";
import { StageStepper } from "@/components/journey/stage-stepper";
import { StageProgressLine } from "@/components/journey/stage-focus-card";
import { ActivityCards } from "@/components/journey/activity-cards";
import { KnownFacts } from "@/components/journey/known-facts";
import { RecommendedNextCard, StageSummaryCard } from "@/components/journey/stage-rails";
import { Panel } from "@/components/ui";

/**
 * One of the six Journey Stages, with every activity inside it. The activities
 * can be opened, started, and finished in any order, and several can be
 * underway at once.
 */
export function JourneyStageView({ stage, s }: { stage: JourneyStage; s: JourneySnapshot }) {
  const progress = useMemo(() => overallProgress(s), [s]);
  const facts = useMemo(() => journeyFacts(s), [s]);
  const summaries = useMemo(() => activitySummaries(s), [s]);
  const sp = progress.stages.find((x) => x.stage.id === stage.id);
  if (!sp) return null;

  const recommended = recommendedActivity(sp);
  // Only answers recorded in this Stage's activities. Stages whose activities
  // record no such answers omit the panel rather than show an empty one.
  const stageFacts = factsForStage(facts, stage.activityIds);
  // A completed Stage lists its facts inside the Stage overview card instead.
  const completedWithFacts = sp.status === "completed" && stageFacts.length > 0;
  const showFacts = !completedWithFacts && (stageFacts.length > 0 || FACT_ACTIVITY_IDS.some((id) => stage.activityIds.includes(id)));

  return (
    <div>
      <JourneyHero
        breadcrumb={[{ label: "Journey", href: "/journey" }, { label: stage.title }]}
        title={stage.title}
      >
        Complete these activities to move this stage forward. You can work on them in any order, and come back anytime.
      </JourneyHero>

      <div className="rounded-xl border border-line bg-surface px-3 py-4 sm:px-6 sm:py-5">
        <StageStepper stages={progress.stages} selectedId={stage.id} />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-8">
        <div className="space-y-6">
          <Panel className="p-5 sm:p-6">
            <div className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              Stage {stage.order} of {progress.totalStages}
            </div>
            <h2 className="font-display text-2xl text-ink">{stage.title}</h2>
            <StageProgressLine sp={sp} pct={Math.round(sp.fraction * 100)} />
            <h3 className="mb-3 mt-6 font-display text-base text-ink">Activities in this stage</h3>
            <ActivityCards activities={sp.activities} recommendedId={recommended?.activity.id} summaries={summaries} />
          </Panel>
        </div>

        <aside className="mt-6 space-y-6 lg:sticky lg:top-24 lg:mt-0">
          <StageSummaryCard sp={sp} facts={stageFacts} />
          {showFacts && <KnownFacts facts={stageFacts} />}
          <RecommendedNextCard recommended={recommended} />
        </aside>
      </div>
    </div>
  );
}
