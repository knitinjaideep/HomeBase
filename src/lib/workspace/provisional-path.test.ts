import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { clearProvisionalPath, readProvisionalPath, writeProvisionalPath } from "./provisional-path";

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

describe("provisional path", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is absent until something is written", () => {
    expect(readProvisionalPath()).toBeNull();
  });

  it("round-trips a written mode", () => {
    writeProvisionalPath("buying");
    expect(readProvisionalPath()).toBe("buying");

    writeProvisionalPath("owning");
    expect(readProvisionalPath()).toBe("owning");
  });

  it("clears the stored value", () => {
    writeProvisionalPath("buying");
    clearProvisionalPath();
    expect(readProvisionalPath()).toBeNull();
  });

  it("ignores a corrupted or unrecognized stored value instead of throwing", () => {
    localStorage.setItem("homescope:provisional-path", "not-a-real-mode");
    expect(readProvisionalPath()).toBeNull();
  });

  it("never throws when storage is unavailable", () => {
    vi.stubGlobal("localStorage", {
      getItem: () => {
        throw new Error("storage disabled");
      },
      setItem: () => {
        throw new Error("storage disabled");
      },
      removeItem: () => {
        throw new Error("storage disabled");
      },
    });

    expect(() => writeProvisionalPath("buying")).not.toThrow();
    expect(readProvisionalPath()).toBeNull();
    expect(() => clearProvisionalPath()).not.toThrow();
  });
});
