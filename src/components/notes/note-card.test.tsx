import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { ToastProvider } from "@/components/toast";
import { NoteCard } from "./note-card";
import type { Note } from "@/lib/models";
import type { ResolvedNoteContext } from "@/lib/notes/context";

function note(overrides: Partial<Note>): Note {
  return {
    id: "n1",
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    title: "",
    body: "Ask about the roof age.",
    pinned: false,
    archived: false,
    noteType: "general",
    contextType: null,
    contextId: null,
    tags: [],
    authorLabel: "",
    ...overrides,
  };
}

function render(n: Note, context: ResolvedNoteContext | null = null) {
  return renderToStaticMarkup(
    <ToastProvider>
      <NoteCard note={n} context={context} />
    </ToastProvider>,
  );
}

describe("NoteCard", () => {
  it("shows a Pin action for an unpinned note and Unpin for a pinned one", () => {
    expect(render(note({ pinned: false }))).toContain(">Pin<");
    expect(render(note({ pinned: true }))).toContain(">Unpin<");
  });

  it("shows an Archive action for an active note and Restore for an archived one", () => {
    expect(render(note({ archived: false }))).toContain(">Archive<");
    expect(render(note({ archived: true }))).toContain(">Restore<");
  });

  it("renders the title, body, and tags", () => {
    const html = render(note({ title: "Plumber", body: "Call back Tuesday.", tags: ["follow-up"] }));
    expect(html).toContain("Plumber");
    expect(html).toContain("Call back Tuesday.");
    expect(html).toContain("follow-up");
  });

  it("shows a note-type badge for anything other than general", () => {
    expect(render(note({ noteType: "question" }))).toContain("Question");
    expect(render(note({ noteType: "general" }))).not.toContain(">General<");
  });

  it("links to the resolved context when available", () => {
    const html = render(
      note({ contextType: "property", contextId: "p1" }),
      { label: "12 Oak St", href: "/properties/p1", available: true },
    );
    expect(html).toContain('href="/properties/p1"');
    expect(html).toContain("12 Oak St");
  });

  it("shows 'Original context unavailable' instead of a broken link when the linked object was deleted", () => {
    const html = render(
      note({ contextType: "property", contextId: "gone" }),
      { label: "Candidate home", href: null, available: false },
    );
    expect(html).toContain("Original context unavailable");
    expect(html).not.toContain('href="/properties/gone"');
  });
});
