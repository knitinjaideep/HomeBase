import Link from "next/link";
import { cn } from "@/lib/util";
import { JOURNEY_STAGES } from "@/lib/guide";
import { recommendedActivity, type ActivityProgress, type JourneyStageProgress } from "@/lib/journey/progress";
import { Panel } from "@/components/ui";
import { StatusPill } from "@/components/journey/journey-ui";

const PRIMARY_LINK =
  "inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90";
const SECONDARY_LINK =
  "inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg px-2 text-sm font-medium text-accent hover:underline";

/**
 * The Stage in focus on the Journey overview: its title, derived progress, and
 * every activity as a chip. Activities are independent — each chip is a plain
 * link to that activity, whatever state the others are in.
 */
export function StageFocusCard({ sp }: { sp: JourneyStageProgress }) {
  const recommended = recommendedActivity(sp);
  const pct = Math.round(sp.fraction * 100);
  const noneStarted = sp.activities.every((ap) => ap.status === "not-started");

  return (
    <Panel className="p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="text-xs font-semibold uppercase tracking-wide text-ink-subtle">
          Stage {sp.stage.order} of {JOURNEY_STAGES.length}
        </div>
        <StatusPill status={sp.status} />
      </div>
      <h2 className="mt-1 font-display text-2xl text-ink sm:text-3xl">{sp.stage.title}</h2>
      <p className="mt-2 max-w-xl text-sm text-ink-muted sm:text-base">{sp.stage.goal}</p>

      <StageProgressLine sp={sp} pct={pct} />

      <div className="mt-6 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <h3 className="font-display text-base text-ink">Activities in this stage</h3>
        <p className="text-xs text-ink-subtle">Do these in any order. Multiple can be in progress at the same time.</p>
      </div>

      <ul className="mt-3 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
        {sp.activities.map((ap) => (
          <li key={ap.activity.id}>
            <ActivityChip ap={ap} recommended={recommended?.activity.id === ap.activity.id} />
          </li>
        ))}
      </ul>

      <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-1">
        {recommended ? (
          <Link
            href={`/journey/${recommended.activity.id}`}
            className={PRIMARY_LINK}
            aria-label={`${noneStarted ? "Start" : "Continue"} with ${recommended.activity.shortTitle}`}
          >
            {noneStarted ? "Start" : "Continue"} <span aria-hidden>→</span>
          </Link>
        ) : (
          <span className="text-sm font-medium text-positive">✓ Every activity in this stage is complete.</span>
        )}
        <Link href={`/journey/${sp.stage.id}`} className={SECONDARY_LINK}>
          View stage details <span aria-hidden>→</span>
        </Link>
      </div>
    </Panel>
  );
}

/** "3 of 7 activities complete", a bar, and the percentage. */
export function StageProgressLine({ sp, pct }: { sp: JourneyStageProgress; pct: number }) {
  return (
    <div className="mt-4 flex flex-col gap-1.5 sm:flex-row sm:items-center sm:gap-4">
      <span className="shrink-0 text-sm text-ink-muted">
        {sp.activitiesDone} of {sp.activitiesTotal} activities complete
        {sp.activitiesInProgress > 0 && <> · {sp.activitiesInProgress} in progress</>}
      </span>
      <div className="flex flex-1 items-center gap-3">
        <div
          className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted"
          role="progressbar"
          aria-label={`${sp.stage.title} progress`}
          aria-valuenow={pct}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className={cn("h-full rounded-full", sp.status === "completed" ? "bg-positive" : "bg-accent")}
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="w-10 shrink-0 text-right text-sm font-medium text-ink">{pct}%</span>
      </div>
    </div>
  );
}

function ActivityChip({ ap, recommended }: { ap: ActivityProgress; recommended: boolean }) {
  const done = ap.status === "completed" || ap.status === "not-applicable";
  const underway = !done && ap.status !== "not-started";
  return (
    <Link
      href={`/journey/${ap.activity.id}`}
      className={cn(
        "flex min-h-[2.75rem] items-center gap-2.5 rounded-lg border px-3 text-sm hover:border-accent/50",
        recommended ? "border-[color:var(--mode-accent-border)] bg-mode-accent-muted/40" : "border-line bg-surface",
      )}
    >
      <span
        aria-hidden
        className={cn(
          "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border text-[11px]",
          done
            ? "border-positive bg-positive text-white"
            : underway
              ? "border-accent bg-accent-soft text-accent"
              : "border-line text-transparent",
        )}
      >
        {done ? "✓" : underway ? "•" : "○"}
      </span>
      <span className="min-w-0 flex-1 truncate text-ink">{ap.activity.shortTitle}</span>
      <span className="sr-only">{done ? "completed" : underway ? "in progress" : "not started"}</span>
      <span aria-hidden className="text-ink-subtle">
        ›
      </span>
    </Link>
  );
}
