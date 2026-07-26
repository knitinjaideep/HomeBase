"use client";

/**
 * The whole cross-device/cross-component sync mechanism: a tiny pub-sub keyed
 * by table name. `repo.ts` calls `invalidateTable()` after every successful
 * write; every `useQuery()` reading that table (in this tab, in any mounted
 * component) refetches. Combined with the window-focus refetch in
 * `use-query.ts`, this is what makes "saved on the iPad, appears on the Mac"
 * work — no websockets, no offline queue, just refetch-on-relevant-events.
 */

type Listener = () => void;

const listeners = new Map<string, Set<Listener>>();

export function subscribeTable(table: string, fn: Listener): () => void {
  let set = listeners.get(table);
  if (!set) {
    set = new Set();
    listeners.set(table, set);
  }
  set.add(fn);
  return () => set!.delete(fn);
}

export function invalidateTable(table: string): void {
  listeners.get(table)?.forEach((fn) => fn());
}

export function invalidateTables(tables: string[]): void {
  tables.forEach(invalidateTable);
}
