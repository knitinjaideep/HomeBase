"use client";

import { useMemo, useState } from "react";
import { useNotes } from "@/lib/hooks";
import { createNote, deleteNote, updateNote } from "@/lib/repo";
import type { Note } from "@/lib/models";
import { PageHeader, Panel, Button, Field, Input, Textarea, EmptyState } from "@/components/ui";
import { dateLabel } from "@/lib/format";
import { useToast } from "@/components/toast";
import { cn } from "@/lib/util";

/**
 * Freeform notes, shared across buyer and homeowner mode (see
 * lib/models/note.ts) — a household jots down anything that doesn't belong
 * to a more specific tool. Kept intentionally simple: title + body, pin to
 * keep something at the top, edit and delete.
 */
export default function NotesPage() {
  const notes = useNotes();
  const { notify } = useToast();
  const [showAdd, setShowAdd] = useState(false);

  const sorted = useMemo(() => {
    return (notes ?? [])
      .slice()
      .sort(
        (a, b) =>
          Number(b.pinned) - Number(a.pinned) ||
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      );
  }, [notes]);

  if (!notes) return <div className="text-ink-subtle">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Notes"
        description="Anything worth writing down — available no matter which HomeScope path you're on."
        actions={<Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Add note"}</Button>}
      />

      {showAdd && (
        <AddNoteForm
          onDone={() => setShowAdd(false)}
          onSaved={() => notify("Note added.")}
        />
      )}

      {sorted.length === 0 ? (
        <EmptyState
          title="No notes yet"
          description="Add your first note — a reminder, a question for tomorrow, anything."
        />
      ) : (
        <div className="space-y-3">
          {sorted.map((note) => (
            <NoteCard key={note.id} note={note} onChanged={() => notify("Note updated.")} />
          ))}
        </div>
      )}
    </div>
  );
}

function AddNoteForm({ onDone, onSaved }: { onDone: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Write something in the note before saving.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await createNote({ title: title.trim(), body: trimmedBody });
      onSaved();
      onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note.");
      setBusy(false);
    }
  };

  return (
    <Panel className="mb-6 p-5 sm:p-6">
      <div className="space-y-3">
        <Field label="Title (optional)">
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Questions for the plumber" />
        </Field>
        <Field label="Note">
          <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your note…" />
        </Field>
        {error && <p className="text-sm text-critical">{error}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onDone} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy}>
            {busy ? "Saving…" : "Save note"}
          </Button>
        </div>
      </div>
    </Panel>
  );
}

function NoteCard({ note, onChanged }: { note: Note; onChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [title, setTitle] = useState(note.title);
  const [body, setBody] = useState(note.body);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) return;
    setBusy(true);
    await updateNote(note.id, { title: title.trim(), body: trimmedBody });
    setBusy(false);
    setEditing(false);
    onChanged();
  };

  const togglePin = async () => {
    await updateNote(note.id, { pinned: !note.pinned });
  };

  const remove = async () => {
    if (!confirm("Delete this note? This can't be undone.")) return;
    await deleteNote(note.id);
  };

  if (editing) {
    return (
      <Panel className="p-5 sm:p-6">
        <div className="space-y-3">
          <Field label="Title (optional)">
            <Input value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Note">
            <Textarea rows={4} value={body} onChange={(e) => setBody(e.target.value)} />
          </Field>
          <div className="flex justify-end gap-2">
            <Button variant="secondary" onClick={() => setEditing(false)} disabled={busy}>
              Cancel
            </Button>
            <Button onClick={save} disabled={busy}>
              {busy ? "Saving…" : "Save"}
            </Button>
          </div>
        </div>
      </Panel>
    );
  }

  return (
    <Panel className={cn("p-5 sm:p-6", note.pinned && "border-[color:var(--mode-accent-border)]")}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          {note.title && <h3 className="font-display text-base text-ink">{note.title}</h3>}
          <p className="mt-1 whitespace-pre-wrap text-sm text-ink-muted">{note.body}</p>
          <p className="mt-2 text-xs text-ink-subtle">Updated {dateLabel(note.updatedAt)}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <Button variant="ghost" size="sm" onClick={togglePin} aria-label={note.pinned ? "Unpin note" : "Pin note"}>
            {note.pinned ? "Unpin" : "Pin"}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setEditing(true)}>
            Edit
          </Button>
          <Button variant="danger" size="sm" onClick={remove}>
            Delete
          </Button>
        </div>
      </div>
    </Panel>
  );
}
