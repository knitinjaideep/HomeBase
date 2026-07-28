import { describe, it, expect } from "vitest";
import { noteSchema } from "./note";

function base() {
  return { id: "n1", createdAt: "2026-07-28T00:00:00.000Z", updatedAt: "2026-07-28T00:00:00.000Z" };
}

describe("noteSchema", () => {
  it("defaults title to empty and pinned to false", () => {
    const note = noteSchema.parse({ ...base(), body: "Ask the plumber about the water heater." });
    expect(note.title).toBe("");
    expect(note.pinned).toBe(false);
  });

  it("requires a non-empty body", () => {
    expect(() => noteSchema.parse({ ...base(), body: "" })).toThrow();
    expect(() => noteSchema.parse({ ...base() })).toThrow();
  });

  it("keeps a provided title and pinned flag", () => {
    const note = noteSchema.parse({ ...base(), title: "Plumber", body: "Call back Tuesday.", pinned: true });
    expect(note.title).toBe("Plumber");
    expect(note.pinned).toBe(true);
  });
});
