"use client";

import { useId, useState } from "react";
import { cn } from "@/lib/util";
import { Button, Field, Input } from "@/components/ui";

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

// ---- Chips -----------------------------------------------------------------

const CHIP_BASE = "inline-flex min-h-[2.5rem] items-center gap-1.5 rounded-full border px-3 text-sm";

/** A chip the household can toggle on and off. */
export function ToggleChip({ label, selected, onToggle }: { label: string; selected: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onToggle}
      className={cn(
        CHIP_BASE,
        selected ? "border-accent bg-accent-soft font-medium text-accent" : "border-line bg-surface text-ink hover:border-accent/50",
      )}
    >
      {selected && <span aria-hidden>✓</span>}
      {label}
    </button>
  );
}

/** A chip that can be removed (custom entries, chosen towns). */
export function RemovableChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span className={cn(CHIP_BASE, "border-accent bg-accent-soft pr-1.5 text-accent")}>
      {label}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove ${label}`}
        className="flex h-7 w-7 items-center justify-center rounded-full hover:bg-accent/15"
      >
        <span aria-hidden>×</span>
      </button>
    </span>
  );
}

/** "+ Add …" button that opens a one-line input; Enter or Add commits, Escape cancels. */
export function AddItem({
  addLabel,
  placeholder,
  suggestions,
  onAdd,
}: {
  addLabel: string;
  placeholder?: string;
  /** Optional autocomplete values (e.g. towns already researched). */
  suggestions?: string[];
  onAdd: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [text, setText] = useState("");
  const listId = useId();

  const commit = () => {
    const value = text.trim();
    if (value) onAdd(value);
    setText("");
    setOpen(false);
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn(CHIP_BASE, "border-dashed border-line text-ink-muted hover:border-accent/50 hover:text-accent")}
      >
        + {addLabel}
      </button>
    );
  }
  return (
    <span className="flex items-center gap-2">
      <Input
        autoFocus
        value={text}
        maxLength={60}
        list={suggestions?.length ? listId : undefined}
        placeholder={placeholder}
        aria-label={addLabel}
        className="w-48"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            commit();
          } else if (e.key === "Escape") {
            setText("");
            setOpen(false);
          }
        }}
      />
      {suggestions?.length ? (
        <datalist id={listId}>
          {suggestions.map((v) => (
            <option key={v} value={v} />
          ))}
        </datalist>
      ) : null}
      <Button type="button" size="sm" onClick={commit}>
        Add
      </Button>
    </span>
  );
}

export interface PresetOption {
  id: string;
  label: string;
}

/**
 * Preset chips to toggle, the household's own custom entries as removable
 * chips, and "+ Add custom". Selected presets and custom entries are separate
 * lists so a preset can be renamed later without losing anyone's custom text.
 */
export function PresetChipPicker({
  presets,
  selected,
  custom,
  onSelectedChange,
  onCustomChange,
  customPlaceholder,
}: {
  presets: PresetOption[];
  selected: string[];
  custom: string[];
  onSelectedChange: (next: string[]) => void;
  onCustomChange: (next: string[]) => void;
  customPlaceholder?: string;
}) {
  const toggle = (id: string) =>
    onSelectedChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const addCustom = (value: string) => {
    const exists = custom.some((c) => c.toLowerCase() === value.toLowerCase());
    if (!exists) onCustomChange([...custom, value]);
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {presets.map((p) => (
        <ToggleChip key={p.id} label={p.label} selected={selected.includes(p.id)} onToggle={() => toggle(p.id)} />
      ))}
      {custom.map((c) => (
        <RemovableChip key={c} label={c} onRemove={() => onCustomChange(custom.filter((x) => x !== c))} />
      ))}
      <AddItem addLabel="Add custom" placeholder={customPlaceholder} onAdd={addCustom} />
    </div>
  );
}
