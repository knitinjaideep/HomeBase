"use client";

import Link from "next/link";
import { cn } from "@/lib/util";
import type { ActivityProgress } from "@/lib/journey/progress";
import { ProgressBar, StatusPill } from "@/components/journey/journey-ui";

/**
 * The activities inside a Stage. They are independent — each row shows only
 * that activity's own status and progress, and any of them can be opened at
 * any time. Nothing here is disabled, ordered as a prerequisite, or hidden
 * behind another row.
 */
export function ActivityList({
  activities,
  showPurpose = false,
  className,
}: {
  activities: ActivityProgress[];
  showPurpose?: boolean;
  className?: string;
}) {
  return (
    <ul className={cn("divide-y divide-line", className)}>
      {activities.map((ap) => (
        <li key={ap.activity.id}>
          <Link
            href={`/journey/${ap.activity.id}`}
            className="group flex min-h-[2.75rem] flex-col gap-2 px-4 py-3 hover:bg-surface-muted"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-sm font-medium text-ink group-hover:text-accent">{ap.activity.shortTitle}</div>
                {showPurpose && <p className="mt-0.5 text-xs text-ink-muted">{ap.activity.purpose}</p>}
              </div>
              <StatusPill status={ap.status} />
            </div>
            <div className="flex items-center gap-3">
              <ProgressBar
                className="flex-1"
                fraction={ap.fraction}
                tone={ap.status === "completed" ? "positive" : "accent"}
              />
              <span className="shrink-0 text-xs text-ink-subtle">
                {ap.actionsDone} of {ap.actionsTotal} tasks
              </span>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}
