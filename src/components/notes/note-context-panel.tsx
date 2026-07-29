"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useNotesForContext } from "@/lib/hooks";
import { useToast } from "@/components/toast";
import { Panel, SectionTitle, Button, EmptyState } from "@/components/ui";
import type { NoteContextType } from "@/lib/models";
import { NoteComposer, type LockedContext } from "./note-composer";
import { NoteCard } from "./note-card";

interface NoteContextPanelProps {
  contextType: NoteContextType;
  /** `null` when this context has no specific record yet (owned home, maintenance, repair/project). */
  contextId: string | null;
  title?: string;
  /** How many recent notes to show before "View all". */
  limit?: number;
}

/**
 * The "notes about this" block other pages embed — property/visit/deal/
 * journey-stage/professional detail pages on the buyer side, HomeBase and
 * Maintenance on the owner side. Same NoteComposer/NoteCard the Notes page
 * uses, just scoped to one fixed context.
 */
export function NoteContextPanel({ contextType, contextId, title = "Notes", limit = 5 }: NoteContextPanelProps) {
  const notes = useNotesForContext(contextType, contextId);
  const { notify } = useToast();
  const [composerType, setComposerType] = useState<"note" | "question" | null>(null);

  const sorted = useMemo(() => {
    return (notes ?? [])
      .slice()
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [notes]);

  const visible = sorted.slice(0, limit);
  const lockedContext: LockedContext = { type: contextType, id: contextId };
  const viewAllHref = `/notes?context=${contextType}:${contextId ?? ""}`;

  return (
    <Panel className="p-4 sm:p-5">
      <SectionTitle
        title={title}
        className="mb-3"
        action={
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" size="sm" onClick={() => setComposerType("question")}>
              Add question
            </Button>
            <Button size="sm" onClick={() => setComposerType("note")}>
              Add note
            </Button>
          </div>
        }
      />

      {composerType && (
        <div className="mb-4">
          <NoteComposer
            lockedContext={lockedContext}
            initialNoteType={composerType === "question" ? "question" : "general"}
            onSaved={() => {
              setComposerType(null);
              notify("Note added.");
            }}
            onCancel={() => setComposerType(null)}
          />
        </div>
      )}

      {notes === undefined ? (
        <p className="text-sm text-ink-subtle">Loading…</p>
      ) : visible.length === 0 ? (
        !composerType && (
          <EmptyState title="No notes yet" description="Jot down anything worth remembering about this." />
        )
      ) : (
        <div className="space-y-2">
          {visible.map((note) => (
            <NoteCard key={note.id} note={note} context={null} compact />
          ))}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="mt-3 text-right">
          <Link href={viewAllHref} className="text-sm font-medium text-accent hover:underline">
            View all {sorted.length > limit ? `(${sorted.length}) ` : ""}notes →
          </Link>
        </div>
      )}
    </Panel>
  );
}
