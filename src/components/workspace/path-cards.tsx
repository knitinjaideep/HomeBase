"use client";

import { cn } from "@/lib/util";
import type { WorkspaceMode } from "@/lib/models";

/**
 * The two path cards on the landing screen. Each card is an accessible radio
 * (a hidden `<input type="radio">` inside its `<label>`, grouped by `name`), so
 * the whole set is one keyboard-navigable radio group — not a pair of div click
 * handlers. Buyer uses the existing mint/teal accent; homeowner uses the amber
 * "caution" token as its warm gold. Selection and keyboard focus are both shown
 * on the visible card (ring + soft glow) in the card's own tone.
 */

type Tone = "accent" | "caution";

interface PathDef {
  mode: WorkspaceMode;
  eyebrow: string;
  title: string;
  blurb: string;
  features: string[];
  tone: Tone;
}

const PATHS: PathDef[] = [
  {
    mode: "buying",
    eyebrow: "Buyer",
    title: "I’m buying a home",
    blurb: "Plan the search, weigh up homes, and get offer-ready — in one calm place.",
    features: [
      "Journey planning",
      "Homes and visits",
      "Questions and notes",
      "Offer preparation",
      "Documents and checklists",
    ],
    tone: "accent",
  },
  {
    mode: "owning",
    eyebrow: "Homeowner",
    title: "I own a home",
    blurb: "Stay on top of upkeep, projects, and the records that come with a home.",
    features: [
      "Maintenance",
      "Repairs and projects",
      "Warranties",
      "Home documents",
      "Recurring tasks and notes",
    ],
    tone: "caution",
  },
];

const TONE: Record<Tone, { ring: string; chip: string; glow: string; icon: string; dot: string }> = {
  accent: {
    ring: "border-accent ring-accent",
    chip: "bg-accent-soft text-accent",
    glow: "bg-accent/25",
    icon: "text-accent",
    dot: "border-accent bg-accent",
  },
  caution: {
    ring: "border-caution ring-caution",
    chip: "bg-caution/15 text-caution",
    glow: "bg-caution/25",
    icon: "text-caution",
    dot: "border-caution bg-caution",
  },
};

const FOCUS: Record<Tone, string> = {
  accent: "focus-within:ring-2 focus-within:ring-accent",
  caution: "focus-within:ring-2 focus-within:ring-caution",
};

export function PathSelectionCards({
  value,
  onChange,
  name = "homescope-path",
}: {
  value: WorkspaceMode | null;
  onChange: (mode: WorkspaceMode) => void;
  name?: string;
}) {
  return (
    <fieldset className="m-0 min-w-0 border-0 p-0">
      <legend className="sr-only">Choose your HomeScope path</legend>
      <div className="grid grid-cols-1 gap-4 sm:gap-5 md:grid-cols-2">
        {PATHS.map((path) => (
          <PathCard
            key={path.mode}
            def={path}
            name={name}
            selected={value === path.mode}
            onSelect={() => onChange(path.mode)}
          />
        ))}
      </div>
    </fieldset>
  );
}

function PathCard({
  def,
  name,
  selected,
  onSelect,
}: {
  def: PathDef;
  name: string;
  selected: boolean;
  onSelect: () => void;
}) {
  const tone = TONE[def.tone];
  return (
    <label
      className={cn(
        "group relative flex cursor-pointer flex-col overflow-hidden rounded-2xl border bg-surface p-6 shadow-sm transition-all sm:p-7",
        FOCUS[def.tone],
        selected
          ? cn("ring-2 shadow-lg", tone.ring)
          : "border-line hover:-translate-y-0.5 hover:shadow-md",
      )}
    >
      <input
        type="radio"
        name={name}
        value={def.mode}
        checked={selected}
        onChange={onSelect}
        className="sr-only"
      />

      {/* Soft glow for depth — brightens on hover, full on selection. */}
      <span
        aria-hidden
        className={cn(
          "pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full blur-3xl transition-opacity duration-300",
          tone.glow,
          selected ? "opacity-100" : "opacity-0 group-hover:opacity-70",
        )}
      />

      <div className="relative flex items-start justify-between gap-3">
        <span className={cn("flex h-11 w-11 items-center justify-center rounded-xl", tone.chip)}>
          <PathIcon mode={def.mode} className={cn("h-6 w-6", tone.icon)} />
        </span>
        <span
          aria-hidden
          className={cn(
            "mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-colors",
            selected ? tone.dot : "border-line",
          )}
        >
          {selected && <CheckIcon className="h-3 w-3 text-white" />}
        </span>
      </div>

      <div className="relative mt-4">
        <span
          className={cn(
            "inline-block rounded-full px-2.5 py-0.5 text-xs font-medium",
            tone.chip,
          )}
        >
          {def.eyebrow}
        </span>
        <h3 className="mt-2 font-display text-xl text-ink sm:text-2xl">{def.title}</h3>
        <p className="mt-1.5 text-sm text-ink-muted">{def.blurb}</p>
      </div>

      <ul className="relative mt-5 space-y-2 border-t border-line pt-4">
        {def.features.map((feature) => (
          <li key={feature} className="flex items-center gap-2.5 text-sm text-ink">
            <CheckIcon className={cn("h-4 w-4 shrink-0", tone.icon)} />
            {feature}
          </li>
        ))}
      </ul>
    </label>
  );
}

function PathIcon({ mode, className }: { mode: WorkspaceMode; className?: string }) {
  if (mode === "buying") {
    // House with a magnifier — searching for a home.
    return (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
        <path d="M3 11.5 12 4l9 7.5" />
        <path d="M5 10.5V20h6" />
        <circle cx="16" cy="15" r="3" />
        <path d="m20.5 19.5-2.3-2.3" />
      </svg>
    );
  }
  // House with a wrench — maintaining a home.
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M4 10.5 12 4l8 6.5" />
      <path d="M6 9.8V20h12v-4" />
      <path d="M15.5 12.5a2.5 2.5 0 0 0-3.2 3.2l-3.1 3.1a1.2 1.2 0 0 0 1.7 1.7l3.1-3.1a2.5 2.5 0 0 0 3.2-3.2l-1.4 1.4-1.3-.3-.3-1.3Z" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}
