/**
 * The path a visitor picks on /get-started, *before* they have an account or
 * household. It is a per-device UI hint, not household data — the same
 * localStorage-only convention `lib/theme.ts` uses for the theme preference —
 * so it never touches Supabase and is simply absent if storage is unavailable
 * (private browsing, disabled storage, etc.).
 *
 * WorkspaceGate reads this once, for a household that has no mode yet, to
 * pre-select WorkspaceOnboarding's path step instead of asking again from
 * scratch. The authenticated workspace row remains the only source of truth
 * for the *actual* mode; this value is discarded once onboarding completes or
 * whenever it doesn't parse as a real mode.
 */

import { workspaceModeSchema, type WorkspaceMode } from "@/lib/models";

const PROVISIONAL_PATH_KEY = "homescope:provisional-path";

export function readProvisionalPath(): WorkspaceMode | null {
  try {
    const raw = localStorage.getItem(PROVISIONAL_PATH_KEY);
    if (!raw) return null;
    const parsed = workspaceModeSchema.safeParse(raw);
    return parsed.success ? parsed.data : null;
  } catch {
    return null;
  }
}

export function writeProvisionalPath(mode: WorkspaceMode): void {
  try {
    localStorage.setItem(PROVISIONAL_PATH_KEY, mode);
  } catch {
    /* ignore — the get-started flow still works without it */
  }
}

export function clearProvisionalPath(): void {
  try {
    localStorage.removeItem(PROVISIONAL_PATH_KEY);
  } catch {
    /* ignore */
  }
}
