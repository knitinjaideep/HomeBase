"use client";

import { cn } from "@/lib/util";
import { Field, Input } from "@/components/ui";

/**
 * Small reusable inputs for activity forms. Add one here when a second activity
 * needs it — not before. Each is a plain controlled component: value in,
 * onChange out, no persistence of its own.
 */

export interface SegmentOption<T extends string | number> {
  value: T;
  label: string;
}

/** Single-select as a row of buttons — for short, mutually exclusive choices. */
export function SegmentedField<T extends string | number>({
  label,
  hint,
  options,
  value,
  onChange,
}: {
  label: string;
  hint?: string;
  options: SegmentOption<T>[];
  value: T | null;
  onChange: (next: T) => void;
}) {
  return (
    <fieldset>
      <legend className="mb-1.5 text-sm font-medium text-ink">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <button
              key={String(o.value)}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(o.value)}
              className={cn(
                "min-h-[2.5rem] rounded-lg border px-3 text-sm",
                selected ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-surface text-ink hover:border-accent/50",
              )}
            >
              {o.label}
            </button>
          );
        })}
      </div>
      {hint && <p className="mt-1 text-xs text-ink-subtle">{hint}</p>}
    </fieldset>
  );
}

/** A whole-number input with a unit label. Empty string means "not set". */
export function NumberField({
  label,
  hint,
  unit,
  value,
  min,
  max,
  onChange,
}: {
  label: string;
  hint?: string;
  unit?: string;
  value: number | null;
  min?: number;
  max?: number;
  onChange: (next: number | null) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <span className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={min}
          max={max}
          className="w-28"
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
        {unit && <span className="text-sm text-ink-muted">{unit}</span>}
      </span>
    </Field>
  );
}
