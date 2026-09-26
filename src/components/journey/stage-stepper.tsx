"use client";

import Link from "next/link";
import { cn } from "@/lib/util";
import type { JourneyStageProgress, JourneyStageStatus } from "@/lib/journey/progress";

/**
 * The six Journey Stages as a stepper: a numbered dot and a small progress bar
 * for each. It is a navigator, not a queue — every Stage is always open, several
 * can be in progress at once, and the highlighted one is just the Stage being
 * looked at. Pass `onSelect` to switch the view in place (the Journey
 * overview); otherwise each step links to that Stage's page. Horizontal from
 * `md` up, a compact vertical list below.
 */
export function StageStepper({
  stages,
  selectedId,
  onSelect,
}: {
  stages: JourneyStageProgress[];
  selectedId: string;
  onSelect?: (id: string) => void;
}) {
  return (
    <>
      <ol className="hidden w-full md:flex" aria-label="Journey stages">
        {stages.map((sp, i) => {
          const selected = sp.stage.id === selectedId;
          return (
            <li key={sp.stage.id} className="flex-1">
              <Step sp={sp} onSelect={onSelect} selected={selected} className="w-full flex-col gap-2 px-1 py-1">
                <span className="flex w-full items-center">
                  <span aria-hidden className={cn("h-px flex-1", i === 0 ? "bg-transparent" : "bg-line")} />
                  <Dot n={sp.stage.order} status={sp.status} selected={selected} />
                  <span aria-hidden className={cn("h-px flex-1", i === stages.length - 1 ? "bg-transparent" : "bg-line")} />
                </span>
                <span className={cn("text-center text-xs font-medium", selected ? "text-ink" : "text-ink-muted")}>
                  {sp.stage.title}
                </span>
                <MiniBar sp={sp} className="w-4/5" />
              </Step>
            </li>
          );
        })}
      </ol>

      <ol className="flex flex-col gap-1 md:hidden" aria-label="Journey stages">
        {stages.map((sp) => {
          const selected = sp.stage.id === selectedId;
          return (
            <li key={sp.stage.id}>
              <Step sp={sp} onSelect={onSelect} selected={selected} className="w-full items-center gap-3 px-2 py-1.5 text-left">
                <Dot n={sp.stage.order} status={sp.status} selected={selected} small />
                <span className="min-w-0 flex-1">
                  <span className={cn("block text-sm", selected ? "font-semibold text-ink" : "text-ink-muted")}>
                    {sp.stage.title}
                  </span>
                  <MiniBar sp={sp} className="mt-1" />
                </span>
                <span className="shrink-0 text-xs text-ink-subtle">
                  {sp.activitiesDone}/{sp.activitiesTotal}
                </span>
              </Step>
            </li>
          );
        })}
      </ol>
    </>
  );
}

function statusLabel(status: JourneyStageStatus): string {
  return status === "completed" ? "completed" : status === "in-progress" ? "in progress" : "not started";
}

/** A link or a button, depending on whether the parent wants in-place selection. */
function Step({
  sp,
  selected,
  onSelect,
  className,
  children,
}: {
  sp: JourneyStageProgress;
  selected: boolean;
  onSelect?: (id: string) => void;
  className?: string;
  children: React.ReactNode;
}) {
  const classes = cn(
    "flex min-h-[2.75rem] items-center rounded-lg hover:bg-surface-muted/60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent",
    className,
  );
  const label = `${sp.stage.title}, ${statusLabel(sp.status)}, ${sp.activitiesDone} of ${sp.activitiesTotal} activities completed`;
  if (onSelect) {
    return (
      <button type="button" onClick={() => onSelect(sp.stage.id)} aria-pressed={selected} aria-label={label} className={classes}>
        {children}
      </button>
    );
  }
  return (
    <Link href={`/journey/${sp.stage.id}`} aria-current={selected ? "page" : undefined} aria-label={label} className={classes}>
      {children}
    </Link>
  );
}

function Dot({ n, status, selected, small }: { n: number; status: JourneyStageStatus; selected: boolean; small?: boolean }) {
  const size = small ? "h-7 w-7 text-xs" : "h-9 w-9 text-sm";
  const done = status === "completed";
  return (
    <span
      aria-hidden
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border font-semibold",
        size,
        selected
          ? "border-mode-accent bg-mode-accent text-white"
          : done
            ? "border-ink bg-ink text-canvas"
            : "border-line bg-surface text-ink-muted",
      )}
    >
      {done ? <CheckIcon /> : n}
    </span>
  );
}

function MiniBar({ sp, className }: { sp: JourneyStageProgress; className?: string }) {
  return (
    <span aria-hidden className={cn("block h-1 overflow-hidden rounded-full bg-surface-muted", className)}>
      <span
        className={cn("block h-full rounded-full", sp.status === "completed" ? "bg-positive" : "bg-mode-accent")}
        style={{ width: `${Math.round(sp.fraction * 100)}%` }}
      />
    </span>
  );
}

function CheckIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}
