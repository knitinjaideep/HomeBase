import Link from "next/link";
import { cn } from "@/lib/util";
import { JOURNEY_STAGES } from "@/lib/guide";
import type { ActivityProgress, JourneyStageProgress } from "@/lib/journey/progress";
import { Panel } from "@/components/ui";
import { StatusPill } from "@/components/journey/journey-ui";
import { FactList } from "@/components/journey/known-facts";
import type { JourneyFact } from "@/lib/journey/facts";

/** The right-hand rail on the Journey overview: every Stage at a glance. */
export function JourneyOverviewRail({
  stages,
  selectedId,
  onSelect,
}: {
  stages: JourneyStageProgress[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  return (
    <Panel className="p-4">
      <h2 className="font-display text-lg text-ink">Journey overview</h2>
      <p className="mt-0.5 text-sm text-ink-muted">Your progress at a glance.</p>
      <ul className="mt-3 divide-y divide-line">
        {stages.map((sp) => {
          const selected = sp.stage.id === selectedId;
          return (
            <li key={sp.stage.id}>
              <button
                type="button"
                onClick={() => onSelect(sp.stage.id)}
                aria-pressed={selected}
                className={cn(
                  "flex min-h-[3.25rem] w-full items-center gap-3 rounded-lg px-2 py-2 text-left hover:bg-surface-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-accent",
                  selected && "bg-mode-accent-muted/50",
                )}
              >
                <span
                  aria-hidden
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
                    selected ? "border-mode-accent bg-mode-accent text-white" : "border-line bg-surface text-ink-muted",
                  )}
                >
                  {sp.stage.order}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center justify-between gap-2">
                    <span className="truncate text-sm font-medium text-ink">{sp.stage.title}</span>
                    <StatusPill status={sp.status} className="!px-2 !py-0.5 !text-[11px]" />
                  </span>
                  <span className="mt-1.5 flex items-center gap-2">
                    <span aria-hidden className="block h-1 flex-1 overflow-hidden rounded-full bg-surface-muted">
                      <span
                        className={cn("block h-full rounded-full", sp.status === "completed" ? "bg-positive" : "bg-mode-accent")}
                        style={{ width: `${Math.round(sp.fraction * 100)}%` }}
                      />
                    </span>
                    <span className="shrink-0 text-xs text-ink-subtle">
                      {sp.activitiesDone} of {sp.activitiesTotal}
                    </span>
                  </span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </Panel>
  );
}

/** A pointer to another Stage. Convenience only — every Stage is always open. */
export function UpNextCard({ sp }: { sp: JourneyStageProgress }) {
  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="font-display text-lg text-ink">Up next</h2>
      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span
            aria-hidden
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-line bg-surface text-xs font-semibold text-ink-muted"
          >
            {sp.stage.order}
          </span>
          <span className="font-medium text-ink">{sp.stage.title}</span>
        </div>
        <StatusPill status={sp.status} />
      </div>
      <p className="mt-2 text-sm text-ink-muted">{sp.stage.goal}</p>
      <Link
        href={`/journey/${sp.stage.id}`}
        className="mt-4 inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg border border-line px-4 text-sm font-medium text-ink hover:border-accent/50 hover:text-accent"
      >
        View details <span aria-hidden>→</span>
      </Link>
    </Panel>
  );
}

/** Stage page rail: the Stage summarised, with the same derived numbers. */
export function StageSummaryCard({ sp, facts = [] }: { sp: JourneyStageProgress; facts?: JourneyFact[] }) {
  const pct = Math.round(sp.fraction * 100);
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex items-start justify-between gap-2">
        <h2 className="font-display text-lg text-ink">Stage overview</h2>
        <StatusPill status={sp.status} />
      </div>
      <div className="mt-3 text-xs text-ink-subtle">Stage {sp.stage.order} of {JOURNEY_STAGES.length}</div>
      <div className="font-display text-2xl text-ink">{sp.stage.title}</div>
      <p className="mt-1 text-sm text-ink-muted">{sp.stage.goal}</p>
      <div className="mt-4 flex items-center justify-between text-sm text-ink-muted">
        <span>
          {sp.activitiesDone} of {sp.activitiesTotal} activities completed
        </span>
        <span className="font-medium text-ink">{pct}%</span>
      </div>
      <div
        className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-muted"
        role="progressbar"
        aria-label={`${sp.stage.title} progress`}
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div className={cn("h-full rounded-full", sp.status === "completed" ? "bg-positive" : "bg-accent")} style={{ width: `${pct}%` }} />
      </div>
      {sp.status === "completed" && facts.length > 0 && (
        <div className="mt-5 border-t border-line pt-4">
          <h3 className="mb-2 font-display text-base text-ink">What you decided</h3>
          <FactList facts={facts} />
        </div>
      )}
    </Panel>
  );
}

/** Stage page rail: a suggestion of where to pick up in this Stage. */
export function RecommendedNextCard({ recommended }: { recommended: ActivityProgress | undefined }) {
  if (!recommended) return null;
  const started = recommended.actionsDone > 0 || recommended.status !== "not-started";
  return (
    <Panel className="border-[color:var(--mode-accent-border)] bg-mode-accent-muted/40 p-4 sm:p-5">
      <h2 className="font-display text-base text-ink">Recommended next step</h2>
      <p className="mt-1 text-sm text-ink-muted">
        {started ? "Pick up where you left off, or start anywhere else — the order is yours." : "A good place to start — or begin anywhere; the order is yours."}
      </p>
      <Link
        href={`/journey/${recommended.activity.id}`}
        className="mt-3 inline-flex min-h-[2.75rem] items-center gap-2 rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
      >
        {started ? "Continue" : "Start"} {recommended.activity.shortTitle} <span aria-hidden>→</span>
      </Link>
    </Panel>
  );
}
