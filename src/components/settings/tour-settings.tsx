"use client";

import { useState } from "react";
import { Button, Panel } from "@/components/ui";
import { useActiveMode } from "@/lib/workspace/mode-context";
import { ProductTourOverlay } from "@/components/tour/product-tour";

/** The explicit way to revisit the first-run tour — it only auto-shows once. */
export function TourSettings() {
  const mode = useActiveMode();
  const [open, setOpen] = useState(false);

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-1 font-display text-lg text-ink">Quick tour</h2>
      <p className="mb-4 max-w-2xl text-sm text-ink-muted">
        A two-minute walkthrough of Journey/HomeBase, notes, documents, and Toolkit.
      </p>
      <Button variant="secondary" onClick={() => setOpen(true)}>
        Take the tour
      </Button>
      <ProductTourOverlay open={open} onClose={() => setOpen(false)} mode={mode} />
    </Panel>
  );
}
