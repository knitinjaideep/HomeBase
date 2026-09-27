import Link from "next/link";
import { cn } from "@/lib/util";
import type { ActivityProgress } from "@/lib/journey/progress";
import { StatusPill } from "@/components/journey/journey-ui";
import { ActivityIcon } from "@/components/journey/activity-icons";

/**
 * One card per activity in a Stage. Cards are independent: each shows only its
 * own status and progress, and every one is open at any time. At most one card
 * carries a "Recommended" badge — a suggestion of where to pick up, never a
 * requirement.
 */
export function ActivityCards({
  activities,
  recommendedId,
  summaries = {},
}: {
  activities: ActivityProgress[];
  recommendedId: string | undefined;
  /** Recorded answers per activity id; shown only when present. */
  summaries?: Record<string, string>;
}) {
  return (
    <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {activities.map((ap) => {
        const recommended = ap.activity.id === recommendedId;
        const started = ap.actionsDone > 0 || ap.status !== "not-started";
        const label = started ? "Continue" : "Start";
        return (
          <li key={ap.activity.id}>
            <Link
              href={`/journey/${ap.activity.id}`}
              className={cn(
                "hs-card-interactive flex h-full flex-col rounded-xl border p-4",
                recommended ? "border-[color:var(--mode-accent-border)] bg-mode-accent-muted/40" : "border-line bg-surface",
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
                  <ActivityIcon id={ap.activity.id} />
                </span>
                <StatusPill status={ap.status} />
              </div>
              <h3 className="mt-3 font-display text-base text-ink">{ap.activity.shortTitle}</h3>
              {recommended && (
                <span className="mt-1 inline-flex w-fit items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent">
                  ✦ Recommended
                </span>
              )}
              <p className="mt-1.5 line-clamp-2 text-sm text-ink-muted">{ap.activity.purpose}</p>
              {summaries[ap.activity.id] && (
                <p className="mt-2 truncate text-sm font-medium text-ink">{summaries[ap.activity.id]}</p>
              )}
              <div className="mt-auto pt-4">
                <div className="flex items-center gap-3">
                  <div
                    className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-muted"
                    role="progressbar"
                    aria-label={`${ap.activity.shortTitle} tasks`}
                    aria-valuenow={Math.round(ap.fraction * 100)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className={cn("h-full rounded-full", ap.status === "completed" ? "bg-positive" : "bg-accent")}
                      style={{ width: `${Math.round(ap.fraction * 100)}%` }}
                    />
                  </div>
                  <span className="shrink-0 text-xs text-ink-subtle">
                    {ap.actionsDone} of {ap.actionsTotal}
                  </span>
                </div>
                {recommended ? (
                  <span className="mt-3 flex min-h-[2.5rem] items-center justify-center rounded-lg bg-accent text-sm font-medium text-white">
                    {label} <span aria-hidden className="ml-2">→</span>
                  </span>
                ) : (
                  <span className="mt-3 inline-flex min-h-[2.5rem] items-center text-sm font-medium text-accent">
                    {ap.status === "completed" ? "Edit" : "View details"} <span aria-hidden className="ml-1.5">→</span>
                  </span>
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
