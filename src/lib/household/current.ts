/**
 * The current household id, set once by `HouseholdProvider` right after
 * sign-in. `repo.ts`'s write helpers are plain async functions (not hooks),
 * so they read it from here instead of a React context — the same
 * lazy-singleton shape this codebase already used for `getDb()`.
 */

let currentHouseholdId: string | null = null;

export function setCurrentHouseholdId(id: string): void {
  currentHouseholdId = id;
}

export function getCurrentHouseholdId(): string {
  if (!currentHouseholdId) {
    throw new Error("No household loaded yet. This shouldn't happen outside the authenticated app shell.");
  }
  return currentHouseholdId;
}
