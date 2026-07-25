"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useJourneySnapshot } from "@/lib/journey/use-snapshot";
import { overallProgress, phaseProgress, stageProgress } from "@/lib/journey/progress";
import { nextActions } from "@/lib/journey/next-actions";
import { GUIDE_STAGES } from "@/lib/guide";
import { monthLabel } from "@/lib/format";
import { Callout, Panel } from "@/components/ui";
import { StatusPill, ProgressBar } from "@/components/journey/journey-ui";
import { PhasePipeline } from "@/components/journey/phase-pipeline";
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
  const phases = useMemo(() => phaseProgress(progress), [progress]);
  const current = progress.currentStage;
  const currentDetail = progress.stages.find((sp) => sp.stage.id === current.id)!;

  const currentIndex = GUIDE_STAGES.findIndex((st) => st.id === current.id);
  const comingNext = GUIDE_STAGES.slice(currentIndex + 1, currentIndex + 3);
  const completedStages = progress.stages.filter((sp) => sp.status === "completed");

  const blocker = useMemo(() => nextActions(s).find((r) => r.level === "critical"), [s]);

  const primaryLabel = currentDetail.status === "not-started" ? "Start this step" : "Continue";
  const dueLabel = current.suggestedWindow ? monthLabel(current.suggestedWindow.end) : null;

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

      <div className="rounded-xl border border-line bg-surface px-4 py-6 sm:px-6">
        <PhasePipeline phases={phases} currentStageTitle={current.shortTitle} />
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

      <section className="mt-8">
        <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Up next</div>
        <Panel className="p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <h2 className="font-display text-xl text-ink sm:text-2xl">{current.title}</h2>
            <StatusPill status={currentDetail.status} />
          </div>
          <p className="mt-1.5 max-w-xl text-sm text-ink-muted">{current.purpose}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Link
              href={`/journey/${current.id}`}
              className="inline-flex min-h-[2.5rem] items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
            >
              {primaryLabel}
            </Link>
            {dueLabel && <span className="text-xs text-ink-subtle">Due by {dueLabel}</span>}
          </div>
        </Panel>
      </section>

      {comingNext.length > 0 && (
        <section className="mt-8">
          <div className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Coming next</div>
          <div className="divide-y divide-line rounded-xl border border-line bg-surface">
            {comingNext.map((stage) => (
              <Link
                key={stage.id}
                href={`/journey/${stage.id}`}
                className="flex items-center justify-between gap-3 px-4 py-3 text-sm text-ink hover:bg-surface-muted"
              >
                {stage.shortTitle}
                <ChevronRight />
              </Link>
            ))}
          </div>
        </section>
      )}

      {completedStages.length > 0 && (
        <details className="group mt-8">
          <summary className="flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-ink-muted hover:text-ink">
            <ChevronRight className="transition-transform group-open:rotate-90" />
            Completed · {completedStages.length}
          </summary>
          <div className="mt-3 divide-y divide-line rounded-xl border border-line bg-surface">
            {completedStages.map((sp) => (
              <Link
                key={sp.stage.id}
                href={`/journey/${sp.stage.id}`}
                className="flex items-center gap-2.5 px-4 py-3 text-sm text-ink-muted hover:bg-surface-muted hover:text-ink"
              >
                <span className="text-positive">✓</span>
                {sp.stage.shortTitle}
              </Link>
            ))}
          </div>
        </details>
      )}

      <details className="group mt-8">
        <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 text-sm font-medium text-accent hover:underline">
          View full journey
        </summary>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {GUIDE_STAGES.map((stage) => {
            const sp = stageProgress(stage, s);
            const isCurrent = stage.id === current.id;
            return (
              <Link
                key={stage.id}
                href={`/journey/${stage.id}`}
                className={`group/card rounded-xl border p-4 transition-colors hover:border-accent/50 ${
                  isCurrent ? "border-accent bg-accent-soft/40" : "border-line bg-surface"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-baseline gap-2">
                    <span className="font-display text-sm text-ink-subtle">{stage.number}</span>
                    <span className="font-medium text-ink group-hover/card:text-accent">{stage.shortTitle}</span>
                  </div>
                  <StatusPill status={sp.status} />
                </div>
                <ProgressBar
                  className="mt-3"
                  fraction={sp.fraction}
                  tone={sp.status === "completed" ? "positive" : "accent"}
                />
              </Link>
            );
          })}
        </div>
      </details>
    </div>
  );
}

function ChevronRight({ className }: { className?: string }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className ?? "text-ink-subtle"}
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
