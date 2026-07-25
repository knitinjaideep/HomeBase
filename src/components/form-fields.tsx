"use client";

import {
  Controller,
  type Control,
  type FieldValues,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { Field, Input, RatingInput, Select, Textarea, Toggle } from "@/components/ui";
import { cn } from "@/lib/util";

/** Empty string → null so optional numeric fields stay null, not NaN. */
export const numberOrNull = {
  setValueAs: (v: string): number | null => (v === "" || v === null ? null : Number(v)),
};

export function TextField<T extends FieldValues>({
  register,
  name,
  label,
  hint,
  placeholder,
  type = "text",
  className,
}: {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  placeholder?: string;
  type?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Input type={type} placeholder={placeholder} {...register(name)} />
    </Field>
  );
}

export function NumberField<T extends FieldValues>({
  register,
  name,
  label,
  hint,
  step,
  prefix,
  className,
}: {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  step?: string;
  prefix?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <div className="relative">
        {prefix && (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-ink-subtle">
            {prefix}
          </span>
        )}
        <Input
          type="number"
          step={step}
          inputMode="decimal"
          className={prefix ? "pl-7" : undefined}
          {...register(name, numberOrNull)}
        />
      </div>
    </Field>
  );
}

export function SelectField<T extends FieldValues>({
  register,
  name,
  label,
  options,
  hint,
  className,
}: {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
  options: Record<string, string>;
  hint?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Select {...register(name)}>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </Select>
    </Field>
  );
}

export function TextareaField<T extends FieldValues>({
  register,
  name,
  label,
  hint,
  rows,
  placeholder,
  className,
}: {
  register: UseFormRegister<T>;
  name: Path<T>;
  label: string;
  hint?: string;
  rows?: number;
  placeholder?: string;
  className?: string;
}) {
  return (
    <Field label={label} hint={hint} className={className}>
      <Textarea rows={rows} placeholder={placeholder} {...register(name)} />
    </Field>
  );
}

export function RatingField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RatingInput
            ariaLabel={label}
            value={(field.value as number | null) ?? null}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  );
}

export function ToggleField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <Controller
      control={control}
      name={name}
      render={({ field }) => (
        <Toggle checked={Boolean(field.value)} onChange={field.onChange} label={label} />
      )}
    />
  );
}

/** Yes / No / Unset control that stores a boolean or null. */
export function TriToggleField<T extends FieldValues>({
  control,
  name,
  label,
}: {
  control: Control<T>;
  name: Path<T>;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-sm text-ink">{label}</span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const value = field.value as boolean | null;
          const opts: { label: string; v: boolean | null }[] = [
            { label: "Yes", v: true },
            { label: "No", v: false },
            { label: "—", v: null },
          ];
          return (
            <div className="inline-flex overflow-hidden rounded-lg border border-line">
              {opts.map((o) => (
                <button
                  key={o.label}
                  type="button"
                  onClick={() => field.onChange(o.v)}
                  className={cn(
                    "min-w-[3rem] px-3 py-1.5 text-sm",
                    value === o.v
                      ? "bg-accent text-white"
                      : "bg-surface text-ink-muted hover:bg-surface-muted",
                  )}
                >
                  {o.label}
                </button>
              ))}
            </div>
          );
        }}
      />
    </div>
  );
}
