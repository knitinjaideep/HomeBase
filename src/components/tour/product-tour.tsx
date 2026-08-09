"use client";

import { useEffect, useState } from "react";
import { Overlay } from "@/components/modal";
import { Button } from "@/components/ui";
import { getTourSteps } from "@/lib/tour/steps";
import type { ResolvedMode } from "@/lib/workspace/resolver";

/**
 * The brief, skippable first-run tour — six short steps, no anchoring/
 * spotlighting of real page elements, built on the same `Overlay` every
 * other dialog uses. Presentational only: callers decide when it opens and
 * what "done" means (see `TourAutoLaunch` for the first-run trigger and
 * `TourSettings` for the reopen-anytime entry point).
 */
export function ProductTourOverlay({
  open,
  onClose,
  mode,
}: {
  open: boolean;
  onClose: () => void;
  mode: ResolvedMode;
}) {
  const steps = getTourSteps(mode);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (open) setIndex(0);
  }, [open]);

  const step = steps[index];
  const isFirst = index === 0;
  const isLast = index === steps.length - 1;

  return (
    <Overlay open={open} onClose={onClose} title="Quick tour" size="md">
      <div className="flex flex-col gap-6 p-5 sm:p-6">
        <div>
          <h3 className="font-display text-lg text-ink">{step.title}</h3>
          <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-1.5" role="group" aria-label="Tour progress">
            {steps.map((s, i) => (
              <span
                key={s.title}
                aria-current={i === index}
                className={`h-1.5 w-1.5 rounded-full transition-colors ${
                  i === index ? "bg-mode-accent" : "bg-line"
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {isFirst ? (
              <Button variant="ghost" size="sm" onClick={onClose}>
                Skip
              </Button>
            ) : (
              <Button variant="secondary" size="sm" onClick={() => setIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button
              size="sm"
              withArrow={!isLast}
              onClick={() => (isLast ? onClose() : setIndex((i) => i + 1))}
            >
              {isLast ? "Done" : "Next"}
            </Button>
          </div>
        </div>
      </div>
    </Overlay>
  );
}
