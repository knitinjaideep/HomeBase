const TOUR_KEY = "homescope:tour-dismissed";

/**
 * Whether the first-run product tour has already been shown (dismissed,
 * skipped, or finished — all treated the same). Per-device only, same
 * localStorage-only convention as `lib/theme.ts` and
 * `lib/workspace/provisional-path.ts` — this is a UI preference, not
 * household data, so it never touches Supabase.
 */
export function hasSeenTour(): boolean {
  try {
    return localStorage.getItem(TOUR_KEY) === "1";
  } catch {
    return false;
  }
}

export function markTourSeen(): void {
  try {
    localStorage.setItem(TOUR_KEY, "1");
  } catch {
    /* ignore — the tour just reappears next visit, which is harmless */
  }
}
