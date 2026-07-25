"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/util";
import {
  GUARDRAIL_LABELS,
  guardrailMessage,
  type GuardrailBand,
} from "@/lib/calculations";

// ---- Button ---------------------------------------------------------------

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
type ButtonSize = "sm" | "md";

const BUTTON_VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white hover:opacity-90",
  secondary: "border border-line bg-surface text-ink hover:bg-surface-muted",
  ghost: "text-ink-muted hover:bg-surface-muted hover:text-ink",
  danger: "border border-line bg-surface text-critical hover:bg-critical/10",
};

const BUTTON_SIZES: Record<ButtonSize, string> = {
  sm: "px-3 py-1.5 text-sm min-h-[2.25rem]",
  md: "px-4 py-2 text-sm min-h-[2.5rem]",
};

export const Button = forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }
>(function Button({ className, variant = "primary", size = "md", ...props }, ref) {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
        BUTTON_VARIANTS[variant],
        BUTTON_SIZES[size],
        className,
      )}
      {...props}
    />
  );
});

// ---- Panel & layout -------------------------------------------------------

export function Panel({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl border border-line bg-surface", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function SectionTitle({
  title,
  hint,
  action,
  className,
}: {
  title: string;
  hint?: string;
  action?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-end justify-between gap-4", className)}>
      <div>
        <h2 className="font-display text-xl text-ink">{title}</h2>
        {hint && <p className="mt-1 text-sm text-ink-muted">{hint}</p>}
      </div>
      {action}
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

// ---- Form fields ----------------------------------------------------------

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label?: string;
  hint?: string;
  htmlFor?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label htmlFor={htmlFor} className={cn("block", className)}>
      {label && <span className="mb-1.5 block text-sm font-medium text-ink">{label}</span>}
      {children}
      {hint && <span className="mt-1 block text-xs text-ink-subtle">{hint}</span>}
    </label>
  );
}

export const Input = forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className, ...props }, ref) {
    return <input ref={ref} className={cn("hs-input", className)} {...props} />;
  },
);

export const Textarea = forwardRef<
  HTMLTextAreaElement,
  React.TextareaHTMLAttributes<HTMLTextAreaElement>
>(function Textarea({ className, rows = 3, ...props }, ref) {
  return <textarea ref={ref} rows={rows} className={cn("hs-input", className)} {...props} />;
});

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn("hs-input pr-8", className)} {...props}>
      {children}
    </select>
  );
});

// ---- Toggle ---------------------------------------------------------------

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2"
    >
      <span
        className={cn(
          "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
          checked ? "bg-accent" : "bg-line",
        )}
      >
        <span
          className={cn(
            "inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform",
            checked ? "translate-x-5" : "translate-x-1",
          )}
        />
      </span>
      {label && <span className="text-sm text-ink">{label}</span>}
    </button>
  );
}

// ---- Chips & tags ---------------------------------------------------------

export function Chip({
  children,
  tone = "neutral",
  className,
}: {
  children: React.ReactNode;
  tone?: "neutral" | "accent" | "sample";
  className?: string;
}) {
  const tones = {
    neutral: "bg-surface-muted text-ink-muted",
    accent: "bg-accent-soft text-accent",
    sample: "border border-caution/40 bg-caution/10 text-caution",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium",
        tones[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

// ---- Guardrail band pill --------------------------------------------------

const BAND_STYLES: Record<GuardrailBand, string> = {
  comfortable: "bg-positive/12 text-positive",
  "above-comfortable": "bg-caution/15 text-caution",
  "near-maximum": "bg-caution/20 text-caution",
  "beyond-limit": "bg-critical/12 text-critical",
  "missing-info": "bg-surface-muted text-ink-subtle",
};

export function BandPill({
  band,
  className,
  label,
}: {
  band: GuardrailBand;
  className?: string;
  label?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium",
        BAND_STYLES[band],
        className,
      )}
    >
      <span className="inline-block h-1.5 w-1.5 rounded-full bg-current opacity-70" aria-hidden />
      {label ?? GUARDRAIL_LABELS[band]}
    </span>
  );
}

/** A calm, factual warning for a property/scenario against a guardrail. */
export function GuardrailNote({ band, subject }: { band: GuardrailBand; subject: string }) {
  const message = guardrailMessage(band, subject);
  if (!message) return null;
  const tone =
    band === "beyond-limit"
      ? "critical"
      : band === "missing-info"
        ? "neutral"
        : "caution";
  return <Callout tone={tone}>{message}</Callout>;
}

// ---- Callout --------------------------------------------------------------

export function Callout({
  tone = "info",
  children,
  className,
}: {
  tone?: "info" | "caution" | "critical" | "neutral";
  children: React.ReactNode;
  className?: string;
}) {
  const tones = {
    info: "border-accent/30 bg-accent-soft text-ink",
    caution: "border-caution/30 bg-caution/10 text-ink",
    critical: "border-critical/30 bg-critical/10 text-ink",
    neutral: "border-line bg-surface-muted text-ink-muted",
  };
  return (
    <div className={cn("rounded-lg border px-3.5 py-2.5 text-sm leading-relaxed", tones[tone], className)}>
      {children}
    </div>
  );
}

// ---- Stat -----------------------------------------------------------------

export function Stat({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-sm text-ink-muted">{label}</div>
      <div className="mt-0.5 font-display text-2xl text-ink">{value}</div>
      {sub && <div className="mt-0.5 text-xs text-ink-subtle">{sub}</div>}
    </div>
  );
}

// ---- Empty state ----------------------------------------------------------

export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-line bg-surface px-6 py-14 text-center">
      <h3 className="font-display text-lg text-ink">{title}</h3>
      {description && <p className="max-w-md text-sm text-ink-muted">{description}</p>}
      {action}
    </div>
  );
}

// ---- Rating input & display ----------------------------------------------

export function RatingInput({
  value,
  onChange,
  ariaLabel,
}: {
  value: number | null;
  onChange: (value: number | null) => void;
  ariaLabel?: string;
}) {
  return (
    <div className="inline-flex items-center gap-1" role="group" aria-label={ariaLabel}>
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          aria-label={`${n} of 5`}
          aria-pressed={value === n}
          onClick={() => onChange(value === n ? null : n)}
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-medium transition-colors",
            value !== null && n <= value
              ? "border-accent bg-accent text-white"
              : "border-line bg-surface text-ink-muted hover:border-accent/50",
          )}
        >
          {n}
        </button>
      ))}
      {value !== null && (
        <button
          type="button"
          onClick={() => onChange(null)}
          className="ml-1 text-xs text-ink-subtle hover:text-ink"
        >
          clear
        </button>
      )}
    </div>
  );
}

/** Read-only rating display as filled dots. */
export function RatingDots({ value }: { value: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-ink-subtle">—</span>;
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${value} of 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span
          key={n}
          className={cn(
            "inline-block h-2 w-2 rounded-full",
            n <= value ? "bg-accent" : "bg-line",
          )}
        />
      ))}
    </span>
  );
}
