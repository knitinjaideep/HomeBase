"use client";

import { useState } from "react";
import { deleteDocument } from "@/lib/repo";
import { DOCUMENT_CATEGORY_LABELS } from "@/lib/labels";
import { Panel, SectionTitle, Button, EmptyState, Field, Input, Select } from "@/components/ui";
import type { DocumentCategory, DocumentRecord } from "@/lib/models";

/** The owner-mode categories relevant to a maintenance item / repair project — a small, scoped subset of the shared enum. */
const OWNER_DOCUMENT_CATEGORIES: DocumentCategory[] = ["warranty", "receipt", "manual", "photo", "home-record"];

export interface DocumentContextPanelProps {
  documents: DocumentRecord[] | undefined;
  title?: string;
  onAdd: (input: { name: string; category: DocumentCategory; storedLocation: string }) => Promise<void>;
}

/**
 * The "documents about this" block for a maintenance item / repair project —
 * mirrors NoteContextPanel's shape (add + list, scoped to one record), but
 * for the documents index rather than notes. Still index-only: a
 * `storedLocation` text reference, no file/photo upload (see
 * lib/models/document.ts).
 */
export function DocumentContextPanel({ documents, title = "Documents & warranties", onAdd }: DocumentContextPanelProps) {
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("receipt");
  const [location, setLocation] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      await onAdd({ name: name.trim(), category, storedLocation: location.trim() });
      setName("");
      setLocation("");
      setShowAdd(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="p-4 sm:p-5">
      <SectionTitle
        title={title}
        className="mb-3"
        action={
          <Button variant="secondary" size="sm" onClick={() => setShowAdd((s) => !s)}>
            {showAdd ? "Close" : "Add document"}
          </Button>
        }
      />

      {showAdd && (
        <div className="mb-4 grid gap-3 sm:grid-cols-3">
          <Field label="Name" className="sm:col-span-1">
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoFocus
              placeholder="e.g. Water heater warranty"
            />
          </Field>
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
              {OWNER_DOCUMENT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {DOCUMENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Stored location (a note)">
            <Input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Where the real file/photo lives"
            />
          </Field>
          <div className="flex justify-end sm:col-span-3">
            <Button size="sm" onClick={submit} disabled={busy}>
              {busy ? "Adding…" : "Add"}
            </Button>
          </div>
        </div>
      )}

      {documents === undefined ? (
        <p className="text-sm text-ink-subtle">Loading…</p>
      ) : documents.length === 0 ? (
        !showAdd && (
          <EmptyState
            title="No documents linked"
            description="Index a warranty, receipt, manual, or photo reference here."
          />
        )
      ) : (
        <div className="space-y-2">
          {documents.map((d) => (
            <div key={d.id} className="flex items-start justify-between gap-3 rounded-lg border border-line px-3 py-2">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-ink">{d.name}</span>
                  <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                    {DOCUMENT_CATEGORY_LABELS[d.category]}
                  </span>
                </div>
                {d.storedLocation && <div className="text-xs text-ink-subtle">{d.storedLocation}</div>}
              </div>
              <button
                type="button"
                onClick={() => void deleteDocument(d.id)}
                className="shrink-0 text-xs text-ink-subtle hover:text-critical"
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}
