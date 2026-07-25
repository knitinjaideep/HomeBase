"use client";

import { useMemo, useState } from "react";
import { useDocuments, useProperties } from "@/lib/hooks";
import { createDocument, deleteDocument, updateDocument } from "@/lib/repo";
import { GUIDE_STAGES } from "@/lib/guide";
import type { DocumentCategory, DocumentRecord, DocumentStatus } from "@/lib/models";
import { documentCategorySchema } from "@/lib/models";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/labels";
import { Panel, Button, Field, Input, Select, Callout, EmptyState } from "@/components/ui";
import { cn } from "@/lib/util";

const CATEGORIES = documentCategorySchema.options as DocumentCategory[];

const STATUS_TONE: Record<DocumentStatus, string> = {
  needed: "bg-caution/15 text-caution",
  requested: "bg-accent-soft text-accent",
  gathered: "bg-positive/12 text-positive",
  submitted: "bg-positive/12 text-positive",
  "not-applicable": "bg-surface-muted text-ink-subtle",
};

/**
 * A document *index* — records that a document exists and where it lives. It
 * stores no files: sensitive paperwork does not belong in browser storage.
 */
export function DocumentIndex() {
  const documents = useDocuments();
  const properties = useProperties();
  const [showAdd, setShowAdd] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState<string>("all");

  const byCategory = useMemo(() => {
    const map = new Map<DocumentCategory, DocumentRecord[]>();
    (documents ?? [])
      .filter((d) => categoryFilter === "all" || d.category === categoryFilter)
      .forEach((d) => {
        const arr = map.get(d.category) ?? [];
        arr.push(d);
        map.set(d.category, arr);
      });
    return map;
  }, [documents, categoryFilter]);

  if (!documents || !properties) return <div className="text-ink-subtle">Loading…</div>;

  return (
    <div>
      <Callout tone="neutral" className="mb-5">
        This is an index only — it records that a document exists and where the real file lives. During the
        MVP, HomeScope deliberately does not store sensitive documents in the browser.
      </Callout>

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <Field label="Category" className="w-60">
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="all">All categories</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Add document"}</Button>
      </div>

      {showAdd && <AddDocumentForm onDone={() => setShowAdd(false)} />}

      {documents.length === 0 ? (
        <EmptyState
          title="No documents indexed yet"
          description="Track what exists and where it is stored — tax returns, statements, the attending contract, the preapproval letter, and so on."
        />
      ) : (
        <div className="space-y-6">
          {CATEGORIES.filter((c) => (byCategory.get(c)?.length ?? 0) > 0).map((c) => (
            <section key={c}>
              <h3 className="mb-2 font-display text-lg text-ink">{DOCUMENT_CATEGORY_LABELS[c]}</h3>
              <div className="space-y-2">
                {byCategory.get(c)!.map((d) => (
                  <DocumentRow key={d.id} doc={d} propertyLabel={propertyLabel(properties, d.relatedPropertyId)} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

function propertyLabel(
  properties: { id: string; address: string }[],
  id: string | null,
): string | undefined {
  if (!id) return undefined;
  return properties.find((p) => p.id === id)?.address;
}

function DocumentRow({ doc, propertyLabel }: { doc: DocumentRecord; propertyLabel?: string }) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<DocumentRecord>) => void updateDocument(doc.id, patch);
  const stage = doc.relatedStageId ? GUIDE_STAGES.find((s) => s.id === doc.relatedStageId) : undefined;

  return (
    <Panel className="p-3">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 text-left">
          <div className="flex items-center gap-2">
            <span className="font-medium text-ink">{doc.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[doc.status])}>
              {DOCUMENT_STATUS_LABELS[doc.status]}
            </span>
          </div>
          <div className="text-xs text-ink-subtle">
            {doc.storedLocation || "location not recorded"}
            {stage ? ` · ${stage.shortTitle}` : ""}
            {propertyLabel ? ` · ${propertyLabel}` : ""}
          </div>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <Select
            className="h-8 min-h-0 w-auto py-0 text-xs"
            value={doc.status}
            onChange={(e) => set({ status: e.target.value as DocumentStatus })}
          >
            {(Object.keys(DOCUMENT_STATUS_LABELS) as DocumentStatus[]).map((s) => (
              <option key={s} value={s}>
                {DOCUMENT_STATUS_LABELS[s]}
              </option>
            ))}
          </Select>
          <button onClick={() => setOpen((o) => !o)} className="text-xs text-ink-subtle hover:text-ink">
            {open ? "Less" : "Edit"}
          </button>
        </div>
      </div>
      {open && (
        <div className="mt-3 grid gap-3 border-t border-line pt-3 sm:grid-cols-2">
          <Field label="Name">
            <Input defaultValue={doc.name} onBlur={(e) => set({ name: e.target.value })} />
          </Field>
          <Field label="Stored location (a note)">
            <Input
              defaultValue={doc.storedLocation}
              placeholder="e.g. home safe / shared drive folder"
              onBlur={(e) => set({ storedLocation: e.target.value })}
            />
          </Field>
          <Field label="Document date">
            <Input
              type="date"
              value={doc.documentDate ?? ""}
              onChange={(e) => set({ documentDate: e.target.value || null })}
            />
          </Field>
          <Field label="Related stage">
            <Select
              value={doc.relatedStageId ?? ""}
              onChange={(e) => set({ relatedStageId: e.target.value || null })}
            >
              <option value="">None</option>
              {GUIDE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.number}. {s.shortTitle}
                </option>
              ))}
            </Select>
          </Field>
          <div className="sm:col-span-2 flex justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Remove "${doc.name}" from the index?`)) void deleteDocument(doc.id);
              }}
            >
              Remove
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function AddDocumentForm({ onDone }: { onDone: () => void }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>("identification");
  const [location, setLocation] = useState("");

  const submit = async () => {
    if (!name.trim()) return;
    await createDocument({ name: name.trim(), category, storedLocation: location.trim(), status: "needed" });
    onDone();
  };

  return (
    <Panel className="mb-5 p-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Document name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. 2025 tax return" />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Stored location (a note)">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where the real file lives" />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>Add to index</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
