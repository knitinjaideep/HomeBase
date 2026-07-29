"use client";

import { useState } from "react";
import { Overlay } from "@/components/modal";

const STEPS = [
  {
    title: "Choose your path",
    blurb: "Tell us whether you're buying a home or already own one. You can switch later.",
  },
  {
    title: "Keep your own notes",
    blurb: "Visits, questions, decisions, repairs, and documents — recorded as you go, in your words.",
  },
  {
    title: "Watch the story build",
    blurb: "Nothing is discarded when your stage changes. The same record carries you from search to ownership.",
  },
];

/**
 * A lightweight, secondary way to explore the product before committing to a
 * path. No dedicated tour route exists yet, so this reuses the app's own
 * `Overlay` modal rather than introducing a new page or a heavier walkthrough
 * library.
 */
export function LandingQuickTour() {
  const [open, setOpen] = useState(false);

  return (
    <section id="how-it-works" className="border-t border-line/60">
      <div className="mx-auto max-w-content px-4 py-4 text-center sm:px-6 sm:py-5">
        <h2 className="font-display text-lg text-ink">Not sure where to begin?</h2>
        <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-muted">
          See how HomeScope works before choosing.
        </p>
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-3 inline-flex min-h-[2.75rem] items-center justify-center rounded-lg border border-line bg-surface/70 px-5 text-sm font-medium text-ink-muted backdrop-blur-sm transition-colors hover:bg-surface-muted hover:text-ink"
        >
          Take a quick tour
        </button>
      </div>

      <Overlay open={open} onClose={() => setOpen(false)} title="How HomeScope works" size="md">
        <div className="space-y-5 p-5">
          <ol className="space-y-4">
            {STEPS.map((step, i) => (
              <li key={step.title} className="flex gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-accent-soft text-sm font-medium text-accent">
                  {i + 1}
                </span>
                <div>
                  <p className="font-display text-sm text-ink">{step.title}</p>
                  <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{step.blurb}</p>
                </div>
              </li>
            ))}
          </ol>
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:opacity-90"
            >
              Got it
            </button>
          </div>
        </div>
      </Overlay>
    </section>
  );
}
