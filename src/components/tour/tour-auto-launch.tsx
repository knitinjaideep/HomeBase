"use client";

import { useEffect, useState } from "react";
import { useActiveMode } from "@/lib/workspace/mode-context";
import { hasSeenTour, markTourSeen } from "@/lib/tour/storage";
import { ProductTourOverlay } from "./product-tour";

/**
 * Mounted once in AppShell (same pattern as QuickNote/BackupReminder): shows
 * the tour automatically the first time this device reaches the app, then
 * never again on its own. `TourSettings` is the separate, explicit way to
 * reopen it later.
 */
export function TourAutoLaunch() {
  const mode = useActiveMode();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!hasSeenTour()) setOpen(true);
  }, []);

  function close() {
    markTourSeen();
    setOpen(false);
  }

  return <ProductTourOverlay open={open} onClose={close} mode={mode} />;
}
