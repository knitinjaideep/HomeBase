const KEY = "homescope:show-starter-templates";

/**
 * A one-shot hint that HomeBase should open the starter-templates picker on
 * its next load. sessionStorage, not the URL: `ConvertToHomeownerDialog`
 * navigates to `/homebase` right after switching mode, and `WorkspaceGate`'s
 * own route guard can re-render and `router.replace("/homebase")` (no query
 * string) in the same tick, racing and clobbering a `?startertemplates=1`
 * query param. A separately-read flag isn't touched by that navigation at
 * all. Same per-device, try/catch-guarded convention as `lib/theme.ts`.
 */
export function markShowStarterTemplates(): void {
  try {
    sessionStorage.setItem(KEY, "1");
  } catch {
    /* ignore — worst case the picker just doesn't auto-open */
  }
}

/** Reads and clears the hint in one step, so it only ever fires once. */
export function consumeShowStarterTemplates(): boolean {
  try {
    const value = sessionStorage.getItem(KEY) === "1";
    sessionStorage.removeItem(KEY);
    return value;
  } catch {
    return false;
  }
}
