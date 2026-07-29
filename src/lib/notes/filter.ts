import type { Note, NoteContextType } from "@/lib/models";

/**
 * Whether a note matches the Notes page search box. Same convention as
 * `propertyMatchesSearch` in lib/property-search.ts: trimmed/lower-cased, a
 * blank query matches everything, and this only ever filters already-loaded
 * rows — it never performs an external lookup.
 */
export function noteMatchesSearch(note: Pick<Note, "title" | "body">, rawQuery: string): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q);
}

export interface NoteFilters {
  query?: string;
  /** `undefined` = no context filter, `null` = general notes only. */
  contextType?: NoteContextType | null;
  /** A note matches if it has at least one of these tags. Empty/omitted = no tag filter. */
  tags?: string[];
  pinnedOnly?: boolean;
  /** Defaults to `false` — the Notes page shows active notes unless this is `true`. */
  archived?: boolean;
}

/** Apply every active filter to a list of already-loaded notes, in one place. */
export function filterNotes(notes: Note[], filters: NoteFilters): Note[] {
  const { query = "", contextType, tags = [], pinnedOnly = false, archived = false } = filters;
  return notes.filter((note) => {
    if (note.archived !== archived) return false;
    if (!noteMatchesSearch(note, query)) return false;
    if (contextType !== undefined && note.contextType !== contextType) return false;
    if (tags.length > 0 && !note.tags.some((t) => tags.includes(t))) return false;
    if (pinnedOnly && !note.pinned) return false;
    return true;
  });
}

/** The union of every tag across a set of notes, for building the tag-filter chips. */
export function allTags(notes: Note[]): string[] {
  const set = new Set<string>();
  notes.forEach((n) => n.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
