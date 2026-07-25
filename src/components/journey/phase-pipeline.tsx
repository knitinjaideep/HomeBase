"use client";

import { cn } from "@/lib/util";
import type { PhaseProgress, PhaseStatus } from "@/lib/journey/progress";

/**
 * The Journey pipeline: six phases, quietly rendered so the whole plan reads
 * in a glance. Horizontal on wider screens (desktop, iPad landscape), a
 * compact vertical stepper below `md`.
 */
export function PhasePipeline({
  phases,
  currentStageTitle,
}: {
  phases: PhaseProgress[];
  currentStageTitle?: string;
}) {
  return (
    <>
      <ol className="hidden w-full md:flex" aria-label="Journey phases">
        {phases.map((p, i) => (
          <li key={p.phase.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <Segment filled={i > 0 && isPastOrCurrent(phases, i - 1)} />
              <PhaseDot status={p.status} />
              <Segment filled={i < phases.length - 1 && isPastOrCurrent(phases, i)} />
            </div>
            <span
              className={cn(
                "text-center text-xs font-medium",
                p.status === "current"
                  ? "text-ink"
                  : p.status === "upcoming"
                    ? "text-ink-subtle"
                    : "text-ink-muted",
              )}
            >
              {p.phase.title}
            </span>
          </li>
        ))}
      </ol>

      <ol className="flex flex-col md:hidden" aria-label="Journey phases">
        {phases.map((p) => (
          <li key={p.phase.id}>
            <div className="flex items-center gap-2.5 py-1">
              <MobileDot status={p.status} />
              <span
                className={cn(
                  "text-sm",
                  p.status === "current"
                    ? "font-semibold text-ink"
                    : p.status === "upcoming"
                      ? "text-ink-subtle"
                      : "text-ink-muted",
                )}
              >
                {p.phase.title}
              </span>
              {p.status === "blocked" && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-caution">
                  <WarningIcon /> Attention needed
                </span>
              )}
            </div>
            {p.status === "current" && currentStageTitle && (
              <div className="-mt-0.5 py-1 pl-[1.65rem] text-xs text-ink-subtle">└ {currentStageTitle}</div>
            )}
          </li>
        ))}
      </ol>
    </>
  );
}

function isPastOrCurrent(phases: PhaseProgress[], index: number): boolean {
  const status = phases[index]?.status;
  return status === "completed" || status === "current" || status === "blocked";
}

function Segment({ filled }: { filled: boolean }) {
  return <span aria-hidden className={cn("h-px flex-1", filled ? "bg-ink/25" : "bg-line")} />;
}

function PhaseDot({ status }: { status: PhaseStatus }) {
  if (status === "completed") {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-canvas"
        aria-label="Completed"
      >
        <CheckIcon />
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 border-caution bg-surface text-caution"
        aria-label="Needs attention"
      >
        <WarningIcon />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent ring-4 ring-accent-soft"
        aria-label="Current phase"
      >
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    );
  }
  return (
    <span
      className="h-7 w-7 shrink-0 rounded-full border border-line bg-surface"
      aria-label="Upcoming"
    />
  );
}

function MobileDot({ status }: { status: PhaseStatus }) {
  if (status === "completed") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
        <CheckIcon small />
      </span>
    );
  }
  if (status === "blocked") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-caution text-caution">
        <WarningIcon small />
      </span>
    );
  }
  if (status === "current") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-accent ring-[3px] ring-accent-soft">
        <span className="h-1.5 w-1.5 rounded-full bg-white" />
      </span>
    );
  }
  return <span className="h-5 w-5 shrink-0 rounded-full border border-line" />;
}

function CheckIcon({ small }: { small?: boolean }) {
  const size = small ? 11 : 13;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="m5 12 5 5 9-10" />
    </svg>
  );
}

function WarningIcon({ small }: { small?: boolean }) {
  const size = small ? 11 : 13;
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 3 2 20h20L12 3Z" />
      <path d="M12 10v4" />
      <circle cx="12" cy="17" r="0.5" fill="currentColor" />
    </svg>
  );
}
