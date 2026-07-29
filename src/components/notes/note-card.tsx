"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/toast";
import { archiveNote, deleteNote, restoreNote, updateNote } from "@/lib/repo";
import { dateLabel } from "@/lib/format";
import { NOTE_TYPE_LABELS } from "@/lib/labels";
import { Panel, Button, Chip } from "@/components/ui";
import { cn } from "@/lib/util";
import type { Note } from "@/lib/models";
import type { ResolvedNoteContext } from "@/lib/notes/context";
import { NoteComposer } from "./note-composer";

interface NoteCardProps {
  note: Note;
  /** Resolved by the parent (already has the household's data loaded) — see lib/notes/context.ts. */
  context: ResolvedNoteContext | null;
  compact?: boolean;
}

/** The one note display used by both the Notes page and the embeddable NoteContextPanel. */
export function NoteCard({ note, context, compact = false }: NoteCardProps) {
  const { notify } = useToast();
  const [editing, setEditing] = useState(false);

  if (editing) {
    return (
      <Panel className="p-4 sm:p-5">
        <NoteComposer
          note={note}
          autoFocusBody={false}
          onSaved={() => {
            setEditing(false);
            notify("Note updated.");
          }}
          onCancel={() => setEditing(false)}
        />
      </Panel>
    );
  }

  const togglePin = () => void updateNote(note.id, { pinned: !note.pinned });

  const toggleArchive = async () => {
    if (note.archived) {
      await restoreNote(note.id);
      notify("Note restored.");
    } else {
      await archiveNote(note.id);
      notify("Note archived.");
    }
  };

  const remove = async () => {
    if (!confirm("Delete this note? This can't be undone.")) return;
    await deleteNote(note.id);
    notify("Note deleted.");
  };

  return (
    <Panel className={cn("p-4 sm:p-5", note.pinned && "border-[color:var(--mode-accent-border)]")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-1 flex flex-wrap items-center gap-1.5">
            {note.noteType !== "general" && <Chip tone="accent">{NOTE_TYPE_LABELS[note.noteType]}</Chip>}
            {context &&
              (context.available && context.href ? (
                <Link href={context.href} className="text-xs font-medium text-accent hover:underline">
                  {context.label}
                </Link>
              ) : context.available ? (
                <span className="text-xs font-medium text-ink-subtle">{context.label}</span>
              ) : (
                <span className="text-xs italic text-ink-subtle">Original context unavailable</span>
              ))}
          </div>
          {note.title && <h3 className="font-display text-base text-ink">{note.title}</h3>}
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{note.body}</p>
          {!compact && note.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {note.tags.map((t) => (
                <Chip key={t}>{t}</Chip>
              ))}
            </div>
          )}
          <p className="mt-2 text-xs text-ink-subtle">
            Updated {dateLabel(note.updatedAt)}
            {note.authorLabel ? ` · ${note.authorLabel}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={togglePin} aria-label={note.pinned ? "Unpin note" : "Pin note"}>
            {note.pinned ? "Unpin" : "Pin"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="ghost" size="sm" onClick={() => void toggleArchive()}>
            {note.archived ? "Restore" : "Archive"}
          </Button>
          {!compact && (
            <Button variant="danger" size="sm" onClick={() => void remove()}>
              Delete
            </Button>
          )}
        </div>
      </div>
    </Panel>
  );
}
