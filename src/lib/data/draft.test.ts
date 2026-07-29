import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { readDraft, writeDraft, clearDraft } from "./draft";

/**
 * `NoteComposer` (components/notes/note-composer.tsx) uses exactly this
 * module, keyed "quick-note", so an accidental close of the Quick Note
 * drawer or a route change mid-note never loses what was typed — see
 * QuickNote in components/notes/quick-note.tsx. This proves the persistence
 * contract it depends on. Same localStorage-mock convention as
 * lib/workspace/provisional-path.test.ts (the vitest env is "node" — no
 * ambient localStorage).
 */
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

interface QuickNoteDraft {
  title: string;
  body: string;
  contextType: string | null;
  contextId: string | null;
}

describe("draft persistence (quick-note)", () => {
  beforeEach(() => {
    vi.stubGlobal("localStorage", memoryStorage());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("is absent until something is written", () => {
    expect(readDraft<QuickNoteDraft>("quick-note")).toBeNull();
  });

  it("round-trips an in-progress note, surviving an accidental close (nothing cleared it)", () => {
    const draft: QuickNoteDraft = { title: "", body: "Ask about the roof age", contextType: "property", contextId: "p1" };
    writeDraft("quick-note", draft);
    expect(readDraft<QuickNoteDraft>("quick-note")).toEqual(draft);

    // Simulates re-mounting the composer after the drawer was dismissed via
    // Escape/backdrop or a route change — the draft is still there.
    expect(readDraft<QuickNoteDraft>("quick-note")).toEqual(draft);
  });

  it("keeps the latest draft as the user keeps typing", () => {
    writeDraft("quick-note", { title: "", body: "Ask about the", contextType: null, contextId: null });
    writeDraft("quick-note", { title: "", body: "Ask about the roof", contextType: null, contextId: null });
    expect(readDraft<QuickNoteDraft>("quick-note")?.body).toBe("Ask about the roof");
  });

  it("clears only on an explicit discard or a confirmed save — not implicitly", () => {
    writeDraft("quick-note", { title: "", body: "Draft", contextType: null, contextId: null });
    clearDraft("quick-note");
    expect(readDraft<QuickNoteDraft>("quick-note")).toBeNull();
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

    expect(() => writeDraft("quick-note", { title: "", body: "x", contextType: null, contextId: null })).not.toThrow();
    expect(readDraft("quick-note")).toBeNull();
    expect(() => clearDraft("quick-note")).not.toThrow();
  });
});
