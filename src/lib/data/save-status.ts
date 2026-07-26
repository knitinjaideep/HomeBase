"use client";

import { useCallback, useRef, useState } from "react";

export type SaveState = "idle" | "saving" | "saved" | "error";

export type SaveResult<T> = { ok: true; value: T } | { ok: false };

export interface SaveStatus {
  status: SaveState;
  error: string | null;
  /**
   * Wraps any repo.ts call: tracks saving/saved/error. Returns a discriminated
   * result rather than `T | undefined` so a `void`-returning mutation's
   * success isn't indistinguishable from a failure — callers branch on `ok`.
   */
  run: <T>(fn: () => Promise<T>) => Promise<SaveResult<T>>;
  /** Re-run the last attempted save (for the "Retry" affordance after an error). */
  retry: () => Promise<void>;
}

const SAVED_DISPLAY_MS = 2000;

/**
 * The one hook behind every "Saving… / Saved / Couldn't save" indicator in
 * the app. On error the status sticks at "error" (with the message) until
 * the user retries or edits again — it never silently reverts to idle, so a
 * failed save is never mistaken for a successful one, and the caller's form
 * data is left untouched (this hook never navigates or clears anything).
 */
export function useSaveStatus(): SaveStatus {
  const [status, setStatus] = useState<SaveState>("idle");
  const [error, setError] = useState<string | null>(null);
  const lastFn = useRef<(() => Promise<unknown>) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const run = useCallback(async <T,>(fn: () => Promise<T>): Promise<SaveResult<T>> => {
    lastFn.current = fn;
    if (timer.current) clearTimeout(timer.current);
    setStatus("saving");
    setError(null);
    try {
      const value = await fn();
      setStatus("saved");
      timer.current = setTimeout(() => setStatus("idle"), SAVED_DISPLAY_MS);
      return { ok: true, value };
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Couldn't save. Check your connection and try again.");
      return { ok: false };
    }
  }, []);

  const retry = useCallback(async () => {
    if (lastFn.current) await run(lastFn.current);
  }, [run]);

  return { status, error, run, retry };
}
