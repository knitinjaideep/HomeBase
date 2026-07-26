"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { subscribeTable } from "./invalidation";

interface QueryOptions {
  /** Values that should trigger a refetch when they change (e.g. householdId, a propertyId param). */
  deps?: unknown[];
  /** Table names whose mutations should trigger a refetch of this query. */
  watch?: string[];
  /** Skip fetching entirely (e.g. while a required id param is still undefined). */
  enabled?: boolean;
}

/**
 * The one hand-rolled data-fetching primitive the whole app is built on:
 * fetch on mount, refetch when deps change, when the window regains focus,
 * or when a watched table is invalidated by a mutation. Keeps showing the
 * last good value while a background refetch is in flight — no loading
 * flicker after the first load, matching the old `useLiveQuery` behavior
 * every component already expects (`undefined` until first load, then
 * always-fresh data).
 */
export function useQuery<T>(fetcher: () => Promise<T>, options: QueryOptions = {}): T | undefined {
  const { deps = [], watch = [], enabled = true } = options;
  const [data, setData] = useState<T | undefined>(undefined);
  const generation = useRef(0);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  const load = useCallback(() => {
    if (!enabled) return;
    const gen = ++generation.current;
    fetcherRef.current()
      .then((result) => {
        if (gen !== generation.current) return; // a newer fetch already resolved
        setData(result);
      })
      .catch((err: unknown) => {
        if (gen !== generation.current) return;
        // eslint-disable-next-line no-console
        console.error("[homescope] query failed", err instanceof Error ? err.message : err);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, ...deps]);

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load]);

  useEffect(() => {
    const onFocus = () => load();
    const onVisible = () => {
      if (document.visibilityState === "visible") load();
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onVisible);
    const unsubs = watch.map((table) => subscribeTable(table, load));
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onVisible);
      unsubs.forEach((u) => u());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [load, watch.join(",")]);

  return data;
}
