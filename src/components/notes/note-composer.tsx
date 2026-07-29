"use client";

import { useEffect, useRef, useState } from "react";
import { createNote, updateNote } from "@/lib/repo";
import { useProperties, useProfessionals, useDocuments } from "@/lib/hooks";
import { useHouseholdContext } from "@/lib/household/context";
import { GUIDE_STAGES } from "@/lib/guide";
import { readDraft, writeDraft, clearDraft } from "@/lib/data/draft";
import { NOTE_CONTEXT_TYPE_LABELS, NOTE_TYPE_LABELS } from "@/lib/labels";
import { Button, Field, Input, Textarea, Select, Toggle } from "@/components/ui";
import { noteContextTypeSchema, noteTypeSchema, type Note, type NoteContextType, type NoteType } from "@/lib/models";

const NOTE_TYPES = noteTypeSchema.options as NoteType[];
const CONTEXT_TYPES = noteContextTypeSchema.options as NoteContextType[];

/** Context types with a small, already-loaded collection to pick a specific record from. */
const PICKABLE_CONTEXT_TYPES: NoteContextType[] = ["property", "professional", "document", "journeyStage"];

export interface LockedContext {
  type: NoteContextType;
  id: string | null;
}

interface DraftShape {
  title: string;
  body: string;
  noteType: NoteType;
  contextType: NoteContextType | null;
  contextId: string | null;
  tags: string[];
  pinned: boolean;
  authorLabel: string;
}

export interface NoteComposerProps {
  /** Present when editing an existing note. */
  note?: Note;
  /** Fixes the context and hides the picker — used when embedded on a specific record's page. */
  lockedContext?: LockedContext;
  /** Starting context for a new, unlocked note (e.g. inferred from the current page). Still changeable. */
  defaultContext?: LockedContext;
  initialNoteType?: NoteType;
  autoFocusBody?: boolean;
  /** When set, persists an in-progress draft to localStorage under this key (Quick Note only). */
  draftKey?: string;
  onSaved: (note: Note) => void;
  onCancel: () => void;
}

/**
 * The one add/edit form behind every note surface in the app — the Notes
 * page, the embeddable NoteContextPanel, and the shell-level Quick Note
 * action all render this, so there is exactly one place note-creation logic
 * lives. See lib/models/note.ts for why `contextType: null` means "general".
 */
export function NoteComposer({
  note,
  lockedContext,
  defaultContext,
  initialNoteType,
  autoFocusBody = true,
  draftKey,
  onSaved,
  onCancel,
}: NoteComposerProps) {
  const { userEmail } = useHouseholdContext();
  const properties = useProperties();
  const professionals = useProfessionals();
  const documents = useDocuments();

  const restored = draftKey ? readDraft<DraftShape>(draftKey) : null;

  const [title, setTitle] = useState(note?.title ?? restored?.title ?? "");
  const [body, setBody] = useState(note?.body ?? restored?.body ?? "");
  const [noteType, setNoteType] = useState<NoteType>(
    note?.noteType ?? restored?.noteType ?? initialNoteType ?? "general",
  );
  const [contextType, setContextType] = useState<NoteContextType | null>(
    lockedContext?.type ?? note?.contextType ?? restored?.contextType ?? defaultContext?.type ?? null,
  );
  const [contextId, setContextId] = useState<string | null>(
    lockedContext?.id ?? note?.contextId ?? restored?.contextId ?? defaultContext?.id ?? null,
  );
  const [tags, setTags] = useState<string[]>(note?.tags ?? restored?.tags ?? []);
  const [tagInput, setTagInput] = useState("");
  const [pinned, setPinned] = useState(note?.pinned ?? restored?.pinned ?? false);
  const [authorLabel, setAuthorLabel] = useState(
    note?.authorLabel ?? restored?.authorLabel ?? (note ? "" : (userEmail ?? "")),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (autoFocusBody) bodyRef.current?.focus();
    // Only on mount — this is a one-time "open the composer, land in the body" behavior.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // An in-progress draft (Quick Note only) so an accidental close of the
  // drawer, or navigating to a different page mid-note, never loses what was
  // typed — cleared only on a confirmed save or an explicit "Discard draft".
  useEffect(() => {
    if (!draftKey) return;
    writeDraft<DraftShape>(draftKey, { title, body, noteType, contextType, contextId, tags, pinned, authorLabel });
  }, [draftKey, title, body, noteType, contextType, contextId, tags, pinned, authorLabel]);

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setTagInput("");
  };
  const removeTag = (t: string) => setTags(tags.filter((x) => x !== t));

  const submit = async () => {
    const trimmedBody = body.trim();
    if (!trimmedBody) {
      setError("Write something before saving.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const patch = {
        title: title.trim(),
        body: trimmedBody,
        noteType,
        contextType: lockedContext?.type ?? contextType,
        contextId: lockedContext?.id ?? contextId,
        tags,
        pinned,
        authorLabel: authorLabel.trim(),
      };
      let saved: Note;
      if (note) {
        await updateNote(note.id, patch);
        saved = { ...note, ...patch };
      } else {
        saved = await createNote(patch);
      }
      if (draftKey) clearDraft(draftKey);
      onSaved(saved);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save the note.");
      setBusy(false);
    }
  };

  const discardDraft = () => {
    if (draftKey) clearDraft(draftKey);
    onCancel();
  };

  return (
    <div
      className="space-y-3"
      onKeyDown={(e) => {
        if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
          e.preventDefault();
          void submit();
        }
      }}
    >
      <Field label="Title (optional)">
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Questions for the plumber" />
      </Field>
      <Field label="Note">
        <Textarea
          ref={bodyRef}
          rows={4}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write your note… (⌘/Ctrl+Enter to save)"
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Type">
          <Select value={noteType} onChange={(e) => setNoteType(e.target.value as NoteType)}>
            {NOTE_TYPES.map((t) => (
              <option key={t} value={t}>
                {NOTE_TYPE_LABELS[t]}
              </option>
            ))}
          </Select>
        </Field>

        {lockedContext ? (
          <Field label="Context">
            <div className="hs-input flex items-center text-ink-muted">{NOTE_CONTEXT_TYPE_LABELS[lockedContext.type]}</div>
          </Field>
        ) : (
          <Field label="Context">
            <Select
              value={contextType ?? ""}
              onChange={(e) => {
                const value = e.target.value as NoteContextType | "";
                setContextType(value === "" ? null : value);
                setContextId(null);
              }}
            >
              <option value="">General workspace</option>
              {CONTEXT_TYPES.map((c) => (
                <option key={c} value={c}>
                  {NOTE_CONTEXT_TYPE_LABELS[c]}
                </option>
              ))}
            </Select>
          </Field>
        )}
      </div>

      {!lockedContext && contextType && PICKABLE_CONTEXT_TYPES.includes(contextType) && (
        <Field label={`Which ${NOTE_CONTEXT_TYPE_LABELS[contextType].toLowerCase()}?`}>
          <Select value={contextId ?? ""} onChange={(e) => setContextId(e.target.value || null)}>
            <option value="">Not a specific one</option>
            {contextType === "property" &&
              (properties ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.address}
                </option>
              ))}
            {contextType === "professional" &&
              (professionals ?? []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            {contextType === "document" &&
              (documents ?? []).map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            {contextType === "journeyStage" &&
              GUIDE_STAGES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.number}. {s.shortTitle}
                </option>
              ))}
          </Select>
        </Field>
      )}

      <Field label="Tags (optional)">
        <div className="flex flex-wrap items-center gap-2">
          {tags.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => removeTag(t)}
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
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Author (optional)">
          <Input value={authorLabel} onChange={(e) => setAuthorLabel(e.target.value)} placeholder="Who wrote this" />
        </Field>
        <div className="flex items-end pb-2.5">
          <Toggle checked={pinned} onChange={setPinned} label="Pin this note" />
        </div>
      </div>

      {error && <p className="text-sm text-critical">{error}</p>}

      <div className="flex justify-end gap-2">
        {draftKey ? (
          <Button variant="ghost" size="sm" onClick={discardDraft} disabled={busy}>
            Discard draft
          </Button>
        ) : (
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            Cancel
          </Button>
        )}
        <Button onClick={submit} disabled={busy}>
          {busy ? "Saving…" : note ? "Save changes" : "Save note"}
        </Button>
      </div>
    </div>
  );
}
