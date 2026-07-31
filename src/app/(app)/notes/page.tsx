"use client";

import { useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import {
  useAllVisits,
  useDeals,
  useDocuments,
  useMaintenanceItems,
  useNotes,
  useProfessionals,
  useProperties,
  useRepairProjects,
} from "@/lib/hooks";
import { resolveNoteContext } from "@/lib/notes/context";
import { filterNotes, allTags } from "@/lib/notes/filter";
import { NOTE_CONTEXT_TYPE_LABELS } from "@/lib/labels";
import { PageHeader, Panel, Button, Field, Input, Select, EmptyState } from "@/components/ui";
import { NoteComposer } from "@/components/notes/note-composer";
import { NoteCard } from "@/components/notes/note-card";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/util";
import type { NoteContextType } from "@/lib/models";

const CONTEXT_TYPES = Object.keys(NOTE_CONTEXT_TYPE_LABELS) as NoteContextType[];

/**
 * A calm, notebook-like home for every note — general and contextual alike.
 * See lib/models/note.ts for the shared model and components/notes/ for the
 * shared composer/card this page has in common with every contextual panel.
 */
export default function NotesPage() {
  const notes = useNotes();
  const properties = useProperties();
  const visits = useAllVisits();
  const deals = useDeals();
  const documents = useDocuments();
  const professionals = useProfessionals();
  const maintenanceItems = useMaintenanceItems();
  const repairProjects = useRepairProjects();
  const { notify } = useToast();
  const searchParams = useSearchParams();

  const [showAdd, setShowAdd] = useState(false);
  const [query, setQuery] = useState("");
  // "all" | "general" | NoteContextType — seeded from a NoteContextPanel's
  // "View all" link (?context=type:id), which also seeds `scopeId` below.
  const [contextFilter, setContextFilter] = useState<string>(() => searchParams.get("context")?.split(":")[0] || "all");
  const [scopeId, setScopeId] = useState<string | null>(() => searchParams.get("context")?.split(":")[1] || null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [pinnedOnly, setPinnedOnly] = useState(false);
  const [showArchived, setShowArchived] = useState(false);

  const tags = useMemo(() => allTags(notes ?? []), [notes]);

  const filtered = useMemo(() => {
    if (!notes) return [];
    const contextType: NoteContextType | null | undefined =
      contextFilter === "all" ? undefined : contextFilter === "general" ? null : (contextFilter as NoteContextType);
    let result = filterNotes(notes, {
      query,
      contextType,
      tags: selectedTags,
      pinnedOnly,
      archived: showArchived,
    });
    if (scopeId) result = result.filter((n) => n.contextId === scopeId);
    return result.sort(
      (a, b) => Number(b.pinned) - Number(a.pinned) || new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
    );
  }, [notes, query, contextFilter, selectedTags, pinnedOnly, showArchived, scopeId]);

  if (!notes || !properties || !visits || !deals || !documents || !professionals || !maintenanceItems || !repairProjects) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const contextData = { properties, visits, deals, documents, professionals, maintenanceItems, repairProjects };

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Anything worth writing down — general, or attached to a home, a visit, an offer, a journey stage, or a professional."
        actions={<Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Add note"}</Button>}
      />

      {showAdd && (
        <Panel className="mb-6 p-5 sm:p-6">
          <NoteComposer
            onSaved={() => {
              setShowAdd(false);
              notify("Note added.");
            }}
            onCancel={() => setShowAdd(false)}
          />
        </Panel>
      )}

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <Field label="Search">
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search title or note text…" />
        </Field>
        <Field label="Context">
          <Select
            value={contextFilter}
            onChange={(e) => {
              setContextFilter(e.target.value);
              setScopeId(null);
            }}
          >
            <option value="all">All contexts</option>
            <option value="general">General (no context)</option>
            {CONTEXT_TYPES.map((c) => (
              <option key={c} value={c}>
                {NOTE_CONTEXT_TYPE_LABELS[c]}
              </option>
            ))}
          </Select>
        </Field>
        <div className="flex items-end gap-2">
          <Button
            variant={pinnedOnly ? "primary" : "secondary"}
            size="sm"
            onClick={() => setPinnedOnly((v) => !v)}
          >
            Pinned
          </Button>
          <Button
            variant={showArchived ? "primary" : "secondary"}
            size="sm"
            onClick={() => setShowArchived((v) => !v)}
          >
            {showArchived ? "Showing archived" : "Show archived"}
          </Button>
        </div>
      </div>

      {scopeId && (
        <div className="mb-4">
          <button
            type="button"
            onClick={() => setScopeId(null)}
            className="text-xs font-medium text-accent hover:underline"
          >
            Scoped to one record — clear to see all {NOTE_CONTEXT_TYPE_LABELS[contextFilter as NoteContextType] ?? "notes"} ×
          </button>
        </div>
      )}

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

      {filtered.length === 0 ? (
        <EmptyState
          title={showArchived ? "No archived notes" : "No notes match"}
          description={
            showArchived
              ? "Notes you archive will show up here, kept but out of the way."
              : "Add your first note — a reminder, a question for tomorrow, anything."
          }
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((note) => (
            <NoteCard key={note.id} note={note} context={resolveNoteContext(note, contextData)} />
          ))}
        </div>
      )}
    </div>
  );
}
