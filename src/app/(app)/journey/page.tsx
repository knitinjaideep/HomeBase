"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useJourneySnapshot } from "@/lib/journey/use-snapshot";
import { overallProgress, readinessByArea, upNextStage } from "@/lib/journey/progress";
import { journeyFacts } from "@/lib/journey/facts";
import { nextActions } from "@/lib/journey/next-actions";
import { JOURNEY_STAGES } from "@/lib/guide";
import { Callout, Panel, SectionTitle } from "@/components/ui";
import { StatusPill, ProgressBar } from "@/components/journey/journey-ui";
import { JourneyHero } from "@/components/journey/journey-hero";
import { StageStepper } from "@/components/journey/stage-stepper";
import { StageFocusCard } from "@/components/journey/stage-focus-card";
import { KnownFacts } from "@/components/journey/known-facts";
import { JourneyOverviewRail, UpNextCard } from "@/components/journey/stage-rails";
import type { JourneySnapshot } from "@/lib/journey/snapshot";

export default function JourneyOverviewPage() {
  const snapshot = useJourneySnapshot();

  if (!snapshot) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  return <JourneyOverview s={snapshot} />;
}

function JourneyOverview({ s }: { s: JourneySnapshot }) {
  const progress = useMemo(() => overallProgress(s), [s]);
  // Which Stage the overview is showing. It starts at the Stage where the
  // household's attention is, but any Stage can be opened — nothing is locked.
  const [selectedId, setSelectedId] = useState<string>(progress.focusStage?.id ?? JOURNEY_STAGES[0].id);
  const selected = progress.stages.find((sp) => sp.stage.id === selectedId) ?? progress.stages[0];
  const upNext = useMemo(() => upNextStage(progress.stages, selected.stage.id), [progress.stages, selected.stage.id]);

  const blocker = useMemo(() => nextActions(s).find((r) => r.level === "critical"), [s]);
  const readiness = useMemo(() => readinessByArea(progress.activities), [progress.activities]);
  const facts = useMemo(() => journeyFacts(s), [s]);

  return (
    <div>
      <JourneyHero eyebrow="Your home journey" title="Home Journey">
        Buy with clarity. Turn a complex process into a clear plan, one stage at a time.
      </JourneyHero>

      <div className="rounded-xl border border-line bg-surface px-3 py-4 sm:px-6 sm:py-5">
        <StageStepper stages={progress.stages} selectedId={selected.stage.id} onSelect={setSelectedId} />
      </div>

      <div className="mt-6 lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-8">
        <div className="space-y-6">
          {blocker && (
            <Callout tone="critical">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="font-medium text-ink">{blocker.title}</div>
                  <p className="mt-0.5 text-ink-muted">{blocker.why}</p>
                </div>
                <Link href={blocker.href} className="shrink-0 text-sm font-medium text-critical hover:underline">
                  View details →
                </Link>
              </div>
            </Callout>
          )}

          <StageFocusCard sp={selected} />
          <KnownFacts facts={facts} />
          <Panel className="p-4 sm:p-5">
            <SectionTitle title="Readiness" className="mb-3" />
            <div className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {readiness.map((a) => (
                <div key={a.area}>
                  <div className="flex items-center justify-between text-xs text-ink-subtle">
                    <span className="font-medium text-ink">{a.label}</span>
                    <StatusPill status={a.status} />
                  </div>
                  <ProgressBar
                    className="mt-1.5"
                    fraction={a.fraction}
                    tone={a.status === "completed" ? "positive" : "accent"}
                  />
                  <p className="mt-1 text-xs text-ink-subtle">{a.summary}</p>
                </div>
              ))}
            </div>
          </Panel>
        </div>

        <aside className="mt-6 space-y-6 lg:sticky lg:top-24 lg:mt-0">
          <JourneyOverviewRail stages={progress.stages} selectedId={selected.stage.id} onSelect={setSelectedId} />
          {upNext && <UpNextCard sp={upNext} />}
        </aside>
      </div>
    </div>
  );
}
