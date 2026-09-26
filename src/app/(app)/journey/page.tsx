"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useJourneySnapshot } from "@/lib/journey/use-snapshot";
import { overallProgress, readinessByArea } from "@/lib/journey/progress";
import { nextActions } from "@/lib/journey/next-actions";
import { monthLabel } from "@/lib/format";
import { SETTLED_STATUSES } from "@/lib/models";
import { Callout, Panel, SectionTitle } from "@/components/ui";
import { StatusPill, ProgressBar } from "@/components/journey/journey-ui";
import { StagePipeline } from "@/components/journey/stage-pipeline";
import { ActivityList } from "@/components/journey/activity-list";
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

  const blocker = useMemo(() => nextActions(s).find((r) => r.level === "critical"), [s]);
  const readiness = useMemo(() => readinessByArea(progress.activities), [progress.activities]);

  // Everything underway right now, across every Stage. Activities run in
  // parallel, so this is a list, not a single "current" step.
  const underway = useMemo(
    () =>
      progress.activities.filter(
        (ap) => !SETTLED_STATUSES.includes(ap.status) && ap.status !== "not-started",
      ),
    [progress.activities],
  );

  return (
    <div>
      <div className="mb-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Home Journey</h1>
        <div className="text-sm text-ink-muted">
          <span className="font-medium text-ink">
            {monthLabel(s.household.idealPurchaseStart)} – {monthLabel(s.household.idealPurchaseEnd)}
          </span>{" "}
          · your target
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-[1fr_20rem] lg:items-start lg:gap-8">
        <div>
          <div className="rounded-xl border border-line bg-surface px-4 py-6 sm:px-6">
            <StagePipeline stages={progress.stages} />
          </div>

          {blocker && (
            <div className="mt-6">
              <Callout tone="critical">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="font-medium text-ink">{blocker.title}</div>
                    <p className="mt-0.5 text-ink-muted">{blocker.why}</p>
                  </div>
                  <Link href={blocker.href} className="shrink-0 text-sm font-medium text-critical hover:underline">
                    Review →
                  </Link>
                </div>
              </Callout>
            </div>
          )}

          <section className="mt-8" aria-labelledby="underway-heading">
            <div id="underway-heading" className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">
              In progress
            </div>
            {underway.length > 0 ? (
              <Panel className="overflow-hidden p-0">
                <ActivityList activities={underway} />
              </Panel>
            ) : (
              <Panel className="p-4 text-sm text-ink-muted">
                Nothing started yet. Activities don&rsquo;t have to happen in order — open any one below to begin.
              </Panel>
            )}
          </section>

          <div className="mt-8 space-y-6">
            {progress.stages.map((sp) => (
              <section key={sp.stage.id} aria-labelledby={`stage-${sp.stage.id}`}>
                <Panel className="overflow-hidden p-0">
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <Link href={`/journey/${sp.stage.id}`} className="group flex items-baseline gap-2">
                        <span className="font-display text-sm text-ink-subtle">{sp.stage.order}</span>
                        <h2
                          id={`stage-${sp.stage.id}`}
                          className="font-display text-lg text-ink group-hover:text-accent sm:text-xl"
                        >
                          {sp.stage.title}
                        </h2>
                      </Link>
                      <StatusPill status={sp.status} />
                    </div>
                    <p className="mt-1 text-sm text-ink-muted">{sp.stage.goal}</p>
                    <div className="mt-3 flex items-center gap-3">
                      <ProgressBar
                        className="flex-1"
                        fraction={sp.fraction}
                        tone={sp.status === "completed" ? "positive" : "accent"}
                      />
                      <span className="shrink-0 text-xs text-ink-subtle">
                        {sp.activitiesDone} of {sp.activitiesTotal} activities
                      </span>
                    </div>
                  </div>
                  <ActivityList activities={sp.activities} className="border-t border-line" />
                </Panel>
              </section>
            ))}
          </div>
        </div>

        <aside className="mt-8 lg:sticky lg:top-24 lg:mt-0">
          <Panel className="p-4">
            <SectionTitle title="Readiness" className="mb-3" />
            <div className="space-y-4">
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
        </aside>
      </div>
    </div>
  );
}
