"use client";

import { cn } from "@/lib/util";

/**
 * An accessible single-choice group rendered as selectable cards. Each option
 * is a real `<input type="radio">` inside its `<label>` (visually hidden, but
 * present for the accessibility tree and keyboard use), grouped by a shared
 * `name` — so arrow-key navigation, Space/Enter selection, and screen-reader
 * grouping all come from the platform rather than hand-rolled key handlers.
 * The visible card reflects focus via `focus-within` and selection via a ring,
 * in the caller's tone (teal for buyer, amber for homeowner).
 */

export interface Choice<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

type Tone = "accent" | "caution";

const SELECTED: Record<Tone, string> = {
  accent: "border-accent ring-accent bg-accent-soft/60",
  caution: "border-caution ring-caution bg-caution/10",
};

const FOCUS: Record<Tone, string> = {
  accent: "focus-within:ring-2 focus-within:ring-accent",
  caution: "focus-within:ring-2 focus-within:ring-caution",
};

export function ChoiceGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
  columns = 2,
  tone = "accent",
}: {
  legend: string;
  name: string;
  options: Choice<T>[];
  value: T;
  onChange: (value: T) => void;
  columns?: 2 | 3;
  tone?: Tone;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="mb-2 p-0 text-sm font-medium text-ink">{legend}</legend>
      <div
        className={cn(
          "grid gap-2",
          columns === 3 ? "grid-cols-1 sm:grid-cols-3" : "grid-cols-1 sm:grid-cols-2",
        )}
      >
        {options.map((opt) => {
          const selected = value === opt.value;
          return (
            <label
              key={opt.value}
              className={cn(
                "relative flex cursor-pointer flex-col rounded-lg border px-3.5 py-3 text-sm transition-colors",
                FOCUS[tone],
                selected
                  ? cn("ring-2", SELECTED[tone])
                  : "border-line bg-surface hover:bg-surface-muted",
              )}
            >
              <input
                type="radio"
                name={name}
                value={opt.value}
                checked={selected}
                onChange={() => onChange(opt.value)}
                className="sr-only"
              />
              <span className="font-medium text-ink">{opt.label}</span>
              {opt.hint && <span className="mt-0.5 text-xs text-ink-subtle">{opt.hint}</span>}
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
