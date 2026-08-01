import type { DocumentCategory, DocumentRecord } from "@/lib/models";
import { getDocumentExpiryStatus } from "./expiry";

/**
 * Whether a document matches the Documents page search box. Same convention
 * as `noteMatchesSearch` in lib/notes/filter.ts: trimmed/lower-cased, a
 * blank query matches everything, and this only ever filters already-loaded
 * rows — it never performs an external lookup.
 */
export function documentMatchesSearch(
  doc: Pick<DocumentRecord, "name" | "notes" | "storedLocation" | "tags">,
  rawQuery: string,
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    doc.name.toLowerCase().includes(q) ||
    doc.notes.toLowerCase().includes(q) ||
    doc.storedLocation.toLowerCase().includes(q) ||
    doc.tags.some((t) => t.toLowerCase().includes(q))
  );
}

export interface DocumentFilters {
  query?: string;
  category?: DocumentCategory;
  /** A document matches if it has at least one of these tags. Empty/omitted = no tag filter. */
  tags?: string[];
  /** Only documents with an expiration date set at all (any status). */
  hasExpiration?: boolean;
}

/** Apply every active filter to a list of already-loaded documents, in one place. */
export function filterDocuments(documents: DocumentRecord[], filters: DocumentFilters): DocumentRecord[] {
  const { query = "", category, tags = [], hasExpiration = false } = filters;
  return documents.filter((doc) => {
    if (!documentMatchesSearch(doc, query)) return false;
    if (category && doc.category !== category) return false;
    if (tags.length > 0 && !doc.tags.some((t) => tags.includes(t))) return false;
    if (hasExpiration && !doc.expirationDate) return false;
    return true;
  });
}

/** The union of every tag across a set of documents, for building the tag-filter chips. */
export function allDocumentTags(documents: DocumentRecord[]): string[] {
  const set = new Set<string>();
  documents.forEach((d) => d.tags.forEach((t) => set.add(t)));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}

/** Documents with an expiration date, soonest-first, restricted to expired/expiring-soon. */
export function expiringDocuments(documents: DocumentRecord[], today: Date = new Date()): DocumentRecord[] {
  return documents
    .filter((d) => {
      const status = getDocumentExpiryStatus(d.expirationDate, today);
      return status === "expired" || status === "expiring-soon";
    })
    .sort((a, b) => (a.expirationDate ?? "").localeCompare(b.expirationDate ?? ""));
}
