"use client";

import Link from "next/link";
import { cn } from "@/lib/util";
import type { JourneyStageProgress, JourneyStageStatus } from "@/lib/journey/progress";

/**
 * The Journey pipeline: the six Stages, quietly rendered so the whole plan
 * reads at a glance. Stages are not steps in a queue — several can be in
 * progress at once, so each dot shows that Stage's own state rather than a
 * single "you are here". Horizontal on wider screens (desktop, iPad
 * landscape), a compact vertical list below `md`.
 */
export function StagePipeline({ stages }: { stages: JourneyStageProgress[] }) {
  return (
    <>
      <ol className="hidden w-full md:flex" aria-label="Journey stages">
        {stages.map((sp, i) => (
          <li key={sp.stage.id} className="flex flex-1 flex-col items-center gap-2">
            <div className="flex w-full items-center">
              <Segment filled={i > 0 && stages[i - 1].status === "completed"} />
              <Link
                href={`/journey/${sp.stage.id}`}
                aria-label={`${sp.stage.title}: ${statusLabel(sp.status)}, ${sp.activitiesDone} of ${sp.activitiesTotal} activities complete`}
                className="rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
              >
                <StageDot status={sp.status} />
              </Link>
              <Segment filled={i < stages.length - 1 && sp.status === "completed"} />
            </div>
            <Link
              href={`/journey/${sp.stage.id}`}
              className={cn(
                "text-center text-xs font-medium hover:text-accent",
                sp.status === "not-started" ? "text-ink-subtle" : "text-ink",
              )}
            >
              {sp.stage.title}
            </Link>
            <span className="text-[11px] text-ink-subtle">
              {sp.activitiesDone}/{sp.activitiesTotal}
            </span>
          </li>
        ))}
      </ol>

      <ol className="flex flex-col md:hidden" aria-label="Journey stages">
        {stages.map((sp) => (
          <li key={sp.stage.id}>
            <Link
              href={`/journey/${sp.stage.id}`}
              className="flex min-h-[2.75rem] items-center gap-2.5 py-1 hover:text-accent"
            >
              <MobileDot status={sp.status} />
              <span className={cn("text-sm", sp.status === "not-started" ? "text-ink-subtle" : "font-medium text-ink")}>
                {sp.stage.title}
              </span>
              <span className="ml-auto text-xs text-ink-subtle">
                {sp.activitiesDone}/{sp.activitiesTotal}
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </>
  );
}

function statusLabel(status: JourneyStageStatus): string {
  return status === "completed" ? "Completed" : status === "in-progress" ? "In progress" : "Not started";
}

function Segment({ filled }: { filled: boolean }) {
  return <span aria-hidden className={cn("h-px flex-1", filled ? "bg-ink/25" : "bg-line")} />;
}

function StageDot({ status }: { status: JourneyStageStatus }) {
  if (status === "completed") {
    return (
      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
        <CheckIcon />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span
        className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-mode-accent"
        style={{ boxShadow: "0 0 0 4px var(--mode-accent-muted)" }}
      >
        <span className="h-2 w-2 rounded-full bg-white" />
      </span>
    );
  }
  return <span className="block h-7 w-7 shrink-0 rounded-full border border-line bg-surface" />;
}

function MobileDot({ status }: { status: JourneyStageStatus }) {
  if (status === "completed") {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-ink text-canvas">
        <CheckIcon small />
      </span>
    );
  }
  if (status === "in-progress") {
    return (
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mode-accent"
        style={{ boxShadow: "0 0 0 3px var(--mode-accent-muted)" }}
      >
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
