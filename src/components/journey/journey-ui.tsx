"use client";

import { cn } from "@/lib/util";
import type { JourneyStatus } from "@/lib/models";
import { JOURNEY_STATUS_LABELS, JOURNEY_STATUS_TONE } from "@/lib/labels";

// ---- Status pill ----------------------------------------------------------

const TONE_STYLES: Record<"positive" | "accent" | "caution" | "neutral", string> = {
  positive: "bg-positive/12 text-positive",
  accent: "bg-accent-soft text-accent",
  caution: "bg-caution/15 text-caution",
  neutral: "bg-surface-muted text-ink-subtle",
};

export function StatusPill({ status, className }: { status: JourneyStatus; className?: string }) {
  const tone = JOURNEY_STATUS_TONE[status];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
        TONE_STYLES[tone],
        className,
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {JOURNEY_STATUS_LABELS[status]}
    </span>
  );
}

// ---- Progress bar ---------------------------------------------------------

export function ProgressBar({
  fraction,
  className,
  tone = "accent",
}: {
  fraction: number;
  className?: string;
  tone?: "accent" | "positive";
}) {
  const pct = Math.round(Math.max(0, Math.min(1, fraction)) * 100);
  const barColor = tone === "positive" ? "bg-positive" : "bg-accent";
  return (
    <div
      className={cn("h-2 w-full overflow-hidden rounded-full bg-surface-muted", className)}
      role="progressbar"
      aria-valuenow={pct}
      aria-valuemin={0}
      aria-valuemax={100}
    >
      <div
        className={cn("h-full rounded-full transition-[width] duration-500", barColor)}
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

// ---- Step section (the consistent guided-page building block) -------------

export function StepSection({
  title,
  hint,
  icon,
  children,
  className,
  defaultOpen = true,
  collapsible = false,
  count,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  defaultOpen?: boolean;
  collapsible?: boolean;
  count?: number;
}) {
  if (!collapsible) {
    return (
      <section className={cn("scroll-mt-24", className)}>
        <SectionHeading title={title} hint={hint} icon={icon} count={count} />
        <div className="mt-3">{children}</div>
      </section>
    );
  }
  return (
    <details className={cn("group scroll-mt-24", className)} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3">
        <SectionHeading title={title} hint={hint} icon={icon} count={count} />
        <svg
          className="h-4 w-4 shrink-0 text-ink-subtle transition-transform group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </summary>
      <div className="mt-3">{children}</div>
    </details>
  );
}

function SectionHeading({
  title,
  hint,
  icon,
  count,
}: {
  title: string;
  hint?: string;
  icon?: React.ReactNode;
  count?: number;
}) {
  return (
    <div className="flex items-baseline gap-2">
      {icon && <span className="text-accent">{icon}</span>}
      <h2 className="font-display text-lg text-ink">{title}</h2>
      {typeof count === "number" && (
        <span className="rounded-full bg-surface-muted px-2 py-0.5 text-xs font-medium text-ink-subtle">
          {count}
        </span>
      )}
      {hint && <span className="text-sm text-ink-subtle">{hint}</span>}
    </div>
  );
}

// ---- A small labelled list item used in the guided pages ------------------

export function BulletList({ items, tone = "neutral" }: { items: string[]; tone?: "neutral" | "caution" }) {
  const dot = tone === "caution" ? "bg-caution" : "bg-accent";
  return (
    <ul className="space-y-2">
      {items.map((item, i) => (
        <li key={i} className="flex items-start gap-2.5 text-sm text-ink-muted">
          <span className={cn("mt-1.5 inline-block h-1.5 w-1.5 shrink-0 rounded-full", dot)} aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}
