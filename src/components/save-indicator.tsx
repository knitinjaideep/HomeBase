"use client";

import { cn } from "@/lib/util";
import type { SaveState } from "@/lib/data/save-status";

/**
 * The shared "Saving… / Saved / Couldn't save" indicator. Renders nothing
 * when idle so it never clutters a form that hasn't been touched yet.
 */
export function SaveIndicator({
  status,
  error,
  onRetry,
  className,
}: {
  status: SaveState;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}) {
  if (status === "idle") return null;

  if (status === "saving") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-subtle", className)} role="status">
        <Spinner />
        Saving…
      </span>
    );
  }

  if (status === "saved") {
    return (
      <span className={cn("inline-flex items-center gap-1.5 text-xs text-positive", className)} role="status">
        <Dot />
        Saved
      </span>
    );
  }

  return (
    <span className={cn("inline-flex items-center gap-2 text-xs text-critical", className)} role="alert">
      <Dot />
      {error ?? "Couldn't save"}
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="font-medium underline underline-offset-2 hover:no-underline"
        >
          Retry
        </button>
      )}
    </span>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 rounded-full bg-current" aria-hidden />;
}

function Spinner() {
  return (
    <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}
