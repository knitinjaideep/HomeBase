"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useDocuments, useMaintenanceItems, useProperties, useRepairProjects } from "@/lib/hooks";
import { createDocument, deleteDocument, updateDocument } from "@/lib/repo";
import { GUIDE_STAGES } from "@/lib/guide";
import { useActiveMode } from "@/lib/workspace/mode-context";
import { useHouseholdContext } from "@/lib/household/context";
import { useToast } from "@/components/toast";
import {
  documentCategoriesForMode,
  documentCategoryGroupsForMode,
} from "@/lib/documents/categories";
import { getDocumentExpiryStatus } from "@/lib/documents/expiry";
import { allDocumentTags, expiringDocuments, filterDocuments } from "@/lib/documents/filter";
import { resolveDocumentLinkedRecords } from "@/lib/documents/context";
import { deleteDocumentFile, getDocumentFileUrl, uploadDocumentFile } from "@/lib/documents/storage";
import type { DocumentCategory, DocumentRecord, DocumentStatus, MaintenanceItem, Property, RepairProject } from "@/lib/models";
import { DOCUMENT_CATEGORY_LABELS, DOCUMENT_STATUS_LABELS } from "@/lib/labels";
import { NoteContextPanel } from "@/components/notes/note-context-panel";
import { Panel, SectionTitle, Button, Field, Input, Textarea, Select, Callout, EmptyState } from "@/components/ui";
import { cn } from "@/lib/util";

const STATUS_TONE: Record<DocumentStatus, string> = {
  needed: "bg-caution/15 text-caution",
  requested: "bg-accent-soft text-accent",
  gathered: "bg-positive/12 text-positive",
  submitted: "bg-positive/12 text-positive",
  "not-applicable": "bg-surface-muted text-ink-subtle",
};

const EXPIRY_TONE: Record<"expired" | "expiring-soon", string> = {
  expired: "bg-critical/12 text-critical",
  "expiring-soon": "bg-caution/15 text-caution",
};

const EXPIRY_TEXT: Record<"expired" | "expiring-soon", string> = {
  expired: "Expired",
  "expiring-soon": "Expiring soon",
};

/**
 * The shared documents system for both buyer and homeowner mode: an
 * organized home record with mode-aware category sections, search/filters,
 * expiring/renewal tracking, and a real (optional) file upload — see
 * lib/documents/storage.ts for why the upload is private-bucket + on-demand
 * signed URLs rather than a public link.
 */
export function DocumentIndex() {
  const mode = useActiveMode();
  const { householdId } = useHouseholdContext();
  const documents = useDocuments();
  const properties = useProperties();
  const maintenanceItems = useMaintenanceItems();
  const repairProjects = useRepairProjects();
  const searchParams = useSearchParams();

  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>(() => searchParams.get("category") || "all");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const categories = documentCategoriesForMode(mode);
  const groups = documentCategoryGroupsForMode(mode);
  const groupedCategories = useMemo(() => new Set(groups.flatMap((g) => g.categories)), [groups]);

  const filtered = useMemo(() => {
    if (!documents) return [];
    return filterDocuments(documents, {
      query,
      category: categoryFilter === "all" ? undefined : (categoryFilter as DocumentCategory),
      tags: selectedTags,
    });
  }, [documents, query, categoryFilter, selectedTags]);

  const tags = useMemo(() => allDocumentTags(documents ?? []), [documents]);
  const expiring = useMemo(() => expiringDocuments(documents ?? []), [documents]);
  const isUnfiltered = !query && categoryFilter === "all" && selectedTags.length === 0;
  const recent = useMemo(
    () =>
      (documents ?? [])
        .slice()
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [documents],
  );

  if (!documents || !properties || !maintenanceItems || !repairProjects) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const byCategory = new Map<DocumentCategory, DocumentRecord[]>();
  filtered.forEach((d) => {
    const arr = byCategory.get(d.category) ?? [];
    arr.push(d);
    byCategory.set(d.category, arr);
  });
  const other = filtered.filter((d) => !groupedCategories.has(d.category));

  const contextData = { properties, maintenanceItems, repairProjects };

  return (
    <div>
      <ExpiringDocumentsPanel documents={expiring} />

      {isUnfiltered && <RecentDocumentsStrip documents={recent} />}

      <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <Field label="Search" className="w-56">
            <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Name, notes, or tag…" />
          </Field>
          <Field label="Category" className="w-60">
            <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
              <option value="all">All categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {DOCUMENT_CATEGORY_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Upload document"}</Button>
      </div>

      {tags.length > 0 && (
        <div className="mb-5 flex flex-wrap gap-1.5">
          {tags.map((t) => {
            const active = selectedTags.includes(t);
            return (
              <button
                key={t}
                type="button"
                onClick={() => setSelectedTags((prev) => (active ? prev.filter((x) => x !== t) : [...prev, t]))}
                className={cn(
                  "rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
                  active ? "bg-accent text-white" : "bg-surface-muted text-ink-muted hover:text-ink",
                )}
              >
                {t}
              </button>
            );
          })}
        </div>
      )}

      {showAdd && (
        <DocumentUploadForm
          mode={mode}
          householdId={householdId}
          properties={properties}
          maintenanceItems={maintenanceItems}
          repairProjects={repairProjects}
          onDone={() => setShowAdd(false)}
        />
      )}

      {documents.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload a file, or just log where a physical original lives — tax returns, the attending contract, a warranty, a receipt, and so on."
        />
      ) : filtered.length === 0 ? (
        <EmptyState title="No documents match" description="Try a different search, category, or tag." />
      ) : (
        <div className="space-y-6">
          {groups.map((group) => {
            const groupDocs = group.categories.flatMap((c) => byCategory.get(c) ?? []);
            if (groupDocs.length === 0) return null;
            return (
              <section key={group.label}>
                <h3 className="mb-2 font-display text-lg text-ink">{group.label}</h3>
                <div className="space-y-2">
                  {groupDocs.map((d) => (
                    <DocumentRow key={d.id} doc={d} mode={mode} contextData={contextData} />
                  ))}
                </div>
              </section>
            );
          })}
          {other.length > 0 && (
            <section>
              <h3 className="mb-2 font-display text-lg text-ink">Other</h3>
              <div className="space-y-2">
                {other.map((d) => (
                  <DocumentRow key={d.id} doc={d} mode={mode} contextData={contextData} />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}

interface ContextData {
  properties: Pick<Property, "id" | "address">[];
  maintenanceItems: Pick<MaintenanceItem, "id" | "title">[];
  repairProjects: Pick<RepairProject, "id" | "title">[];
}

/**
 * The "expiring or renewal dates" callout — pure/prop-driven (no hooks), so
 * it's directly unit-testable. `documents` is expected to already be
 * filtered to expired/expiring-soon (see lib/documents/filter.ts's
 * `expiringDocuments`).
 */
export function ExpiringDocumentsPanel({ documents }: { documents: DocumentRecord[] }) {
  if (documents.length === 0) return null;
  return (
    <Panel className="mb-5 border-caution/30 p-4 sm:p-5">
      <SectionTitle title="Expiring or renewal dates" className="mb-3" />
      <div className="space-y-1.5">
        {documents.map((d) => {
          const status = getDocumentExpiryStatus(d.expirationDate) as "expired" | "expiring-soon";
          return (
            <div key={d.id} className="flex flex-wrap items-center justify-between gap-2 text-sm">
              <span className="text-ink">{d.name}</span>
              <span className="flex items-center gap-2 text-xs text-ink-subtle">
                {d.expirationDate}
                <span className={cn("rounded-full px-2 py-0.5 font-medium", EXPIRY_TONE[status])}>
                  {EXPIRY_TEXT[status]}
                </span>
              </span>
            </div>
          );
        })}
      </div>
    </Panel>
  );
}

/** A quick-glance strip of the most recently added documents — pure/prop-driven, no hooks. */
export function RecentDocumentsStrip({ documents }: { documents: DocumentRecord[] }) {
  if (documents.length === 0) return null;
  return (
    <div className="mb-5">
      <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">Recent documents</h3>
      <div className="flex flex-wrap gap-2">
        {documents.map((d) => (
          <span key={d.id} className="rounded-full border border-line bg-surface px-3 py-1 text-xs text-ink-muted">
            {d.name} <span className="text-ink-subtle">· {DOCUMENT_CATEGORY_LABELS[d.category]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

function TagChips({ tags, onChange }: { tags: string[]; onChange: (tags: string[]) => void }) {
  const [tagInput, setTagInput] = useState("");
  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) onChange([...tags, t]);
    setTagInput("");
  };
  return (
    <div className="flex flex-wrap items-center gap-2">
      {tags.map((t) => (
        <button
          key={t}
          type="button"
          onClick={() => onChange(tags.filter((x) => x !== t))}
          className="inline-flex items-center gap-1 rounded-full bg-surface-muted px-2.5 py-0.5 text-xs font-medium text-ink-muted hover:text-ink"
        >
          {t} ×
        </button>
      ))}
      <Input
        value={tagInput}
        onChange={(e) => setTagInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            addTag();
          }
        }}
        onBlur={addTag}
        placeholder="Add a tag, press Enter"
        className="w-40"
      />
    </div>
  );
}

function DocumentRow({
  doc,
  mode,
  contextData,
}: {
  doc: DocumentRecord;
  mode: ReturnType<typeof useActiveMode>;
  contextData: ContextData;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { notify } = useToast();
  const { householdId } = useHouseholdContext();
  const set = (patch: Partial<DocumentRecord>) => void updateDocument(doc.id, patch);
  const stage = doc.relatedStageId ? GUIDE_STAGES.find((s) => s.id === doc.relatedStageId) : undefined;
  const links = resolveDocumentLinkedRecords(doc, contextData);
  const expiryStatus = getDocumentExpiryStatus(doc.expirationDate);

  const openFile = async () => {
    if (!doc.filePath) return;
    try {
      const url = await getDocumentFileUrl(doc.filePath);
      window.open(url, "_blank", "noopener,noreferrer");
    } catch {
      notify("Could not open the file — try again.");
    }
  };

  const attachFile = async (file: File) => {
    setBusy(true);
    try {
      const uploaded = await uploadDocumentFile(householdId, doc.id, file);
      await updateDocument(doc.id, uploaded);
    } catch {
      notify("Could not upload the file — try again.");
    } finally {
      setBusy(false);
    }
  };

  const removeFile = async () => {
    if (doc.filePath) await deleteDocumentFile(doc.filePath);
    await updateDocument(doc.id, { filePath: null, fileName: null, fileSize: null, fileMimeType: null });
  };

  const remove = async () => {
    if (!confirm(`Remove "${doc.name}"?`)) return;
    if (doc.filePath) await deleteDocumentFile(doc.filePath);
    await deleteDocument(doc.id);
  };

  return (
    <Panel className="p-3">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{doc.name}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_TONE[doc.status])}>
              {DOCUMENT_STATUS_LABELS[doc.status]}
            </span>
            {doc.fileName && (
              <span className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] font-medium text-ink-muted">
                File attached
              </span>
            )}
            {(expiryStatus === "expired" || expiryStatus === "expiring-soon") && (
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", EXPIRY_TONE[expiryStatus])}>
                {EXPIRY_TEXT[expiryStatus]}
              </span>
            )}
          </div>
          <div className="text-xs text-ink-subtle">
            {doc.storedLocation || (doc.fileName ? "" : "no file or location recorded")}
            {stage ? ` · ${stage.shortTitle}` : ""}
            {links.map((l) => ` · ${l.label}`).join("")}
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
        <div className="mt-3 space-y-4 border-t border-line pt-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Name">
              <Input defaultValue={doc.name} onBlur={(e) => set({ name: e.target.value })} />
            </Field>
            <Field label="Category">
              <Select value={doc.category} onChange={(e) => set({ category: e.target.value as DocumentCategory })}>
                {documentCategoriesForMode(mode).map((c) => (
                  <option key={c} value={c}>
                    {DOCUMENT_CATEGORY_LABELS[c]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Stored location (physical original)">
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
            <Field label="Expiration / renewal date">
              <Input
                type="date"
                value={doc.expirationDate ?? ""}
                onChange={(e) => set({ expirationDate: e.target.value || null })}
              />
            </Field>
            {mode === "owning" ? (
              <>
                <Field label="Linked maintenance item">
                  <Select
                    value={doc.relatedMaintenanceItemId ?? ""}
                    onChange={(e) => set({ relatedMaintenanceItemId: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {contextData.maintenanceItems.map((i) => (
                      <option key={i.id} value={i.id}>
                        {i.title}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Linked repair / project">
                  <Select
                    value={doc.relatedRepairProjectId ?? ""}
                    onChange={(e) => set({ relatedRepairProjectId: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {contextData.repairProjects.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.title}
                      </option>
                    ))}
                  </Select>
                </Field>
              </>
            ) : (
              <>
                <Field label="Linked home">
                  <Select
                    value={doc.relatedPropertyId ?? ""}
                    onChange={(e) => set({ relatedPropertyId: e.target.value || null })}
                  >
                    <option value="">None</option>
                    {contextData.properties.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.address}
                      </option>
                    ))}
                  </Select>
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
              </>
            )}
          </div>

          <Field label="Tags">
            <TagChips tags={doc.tags} onChange={(tags) => set({ tags })} />
          </Field>

          <Field label="Notes">
            <Textarea defaultValue={doc.notes} onBlur={(e) => set({ notes: e.target.value })} />
          </Field>

          <Field label="File">
            <div className="flex flex-wrap items-center gap-2">
              {doc.fileName ? (
                <>
                  <Button variant="secondary" size="sm" onClick={openFile}>
                    View {doc.fileName}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={removeFile} disabled={busy}>
                    Remove file
                  </Button>
                </>
              ) : (
                <Input
                  type="file"
                  disabled={busy}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void attachFile(file);
                  }}
                />
              )}
            </div>
          </Field>

          <div className="flex justify-end">
            <Button variant="danger" size="sm" onClick={remove}>
              Remove
            </Button>
          </div>

          <NoteContextPanel contextType="document" contextId={doc.id} title="Notes about this document" limit={3} />
        </div>
      )}
    </Panel>
  );
}

function DocumentUploadForm({
  mode,
  householdId,
  properties,
  maintenanceItems,
  repairProjects,
  onDone,
}: {
  mode: ReturnType<typeof useActiveMode>;
  householdId: string;
  properties: Pick<Property, "id" | "address">[];
  maintenanceItems: Pick<MaintenanceItem, "id" | "title">[];
  repairProjects: Pick<RepairProject, "id" | "title">[];
  onDone: () => void;
}) {
  const categories = documentCategoriesForMode(mode);
  const { notify } = useToast();
  const [name, setName] = useState("");
  const [category, setCategory] = useState<DocumentCategory>(categories[0]);
  const [location, setLocation] = useState("");
  const [expirationDate, setExpirationDate] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [relatedPropertyId, setRelatedPropertyId] = useState("");
  const [relatedMaintenanceItemId, setRelatedMaintenanceItemId] = useState("");
  const [relatedRepairProjectId, setRelatedRepairProjectId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const created = await createDocument({
        name: name.trim(),
        category,
        storedLocation: location.trim(),
        status: "needed",
        expirationDate: expirationDate || null,
        tags,
        relatedPropertyId: mode === "owning" ? null : relatedPropertyId || null,
        relatedMaintenanceItemId: mode === "owning" ? relatedMaintenanceItemId || null : null,
        relatedRepairProjectId: mode === "owning" ? relatedRepairProjectId || null : null,
      });
      if (file) {
        try {
          const uploaded = await uploadDocumentFile(householdId, created.id, file);
          await updateDocument(created.id, uploaded);
        } catch {
          notify("Document saved, but the file upload failed — attach it again from Edit.");
        }
      }
      onDone();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-5 p-4">
      <Callout tone="neutral" className="mb-4">
        Attach a file, log where a physical original lives, or both — HomeScope only stores what you upload; it
        never reads or classifies a document&rsquo;s contents.
      </Callout>
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Document name">
          <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus placeholder="e.g. 2025 tax return" />
        </Field>
        <Field label="Category">
          <Select value={category} onChange={(e) => setCategory(e.target.value as DocumentCategory)}>
            {categories.map((c) => (
              <option key={c} value={c}>
                {DOCUMENT_CATEGORY_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Stored location (optional)">
          <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Where a physical original lives" />
        </Field>
        <Field label="File (optional)">
          <Input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        <Field label="Expiration / renewal date (optional)">
          <Input type="date" value={expirationDate} onChange={(e) => setExpirationDate(e.target.value)} />
        </Field>
        {mode === "owning" ? (
          <>
            <Field label="Linked maintenance item (optional)">
              <Select value={relatedMaintenanceItemId} onChange={(e) => setRelatedMaintenanceItemId(e.target.value)}>
                <option value="">None</option>
                {maintenanceItems.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Linked repair / project (optional)">
              <Select value={relatedRepairProjectId} onChange={(e) => setRelatedRepairProjectId(e.target.value)}>
                <option value="">None</option>
                {repairProjects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </Select>
            </Field>
          </>
        ) : (
          <Field label="Linked home (optional)">
            <Select value={relatedPropertyId} onChange={(e) => setRelatedPropertyId(e.target.value)}>
              <option value="">None</option>
              {properties.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>
      <div className="mt-3">
        <Field label="Tags (optional)">
          <TagChips tags={tags} onChange={setTags} />
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : "Add document"}
        </Button>
        <Button variant="secondary" onClick={onDone} disabled={busy}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
