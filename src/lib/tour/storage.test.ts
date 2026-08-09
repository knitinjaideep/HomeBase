import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { hasSeenTour, markTourSeen } from "./storage";

/** Minimal in-memory Storage stand-in — the vitest env is "node", with no ambient localStorage. */
function memoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, value),
    removeItem: (key) => void store.delete(key),
    clear: () => store.clear(),
    key: (index) => Array.from(store.keys())[index] ?? null,
    get length() {
      return store.size;
    },
  };
}

describe("tour storage", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("has not been seen until marked", () => {
    expect(hasSeenTour()).toBe(false);
  });

  it("stays seen once marked", () => {
    markTourSeen();
    expect(hasSeenTour()).toBe(true);
  });

  it("never throws when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
    });

    expect(() => markTourSeen()).not.toThrow();
    expect(hasSeenTour()).toBe(false);
  });
});
