"use client";

import { useState } from "react";
import { usePathname, useParams } from "next/navigation";
import { Overlay } from "@/components/modal";
import { useToast } from "@/components/toast";
import { inferContextFromPath } from "@/lib/notes/context";
import { NoteComposer } from "./note-composer";

const DRAFT_KEY = "quick-note";

/**
 * The shared quick-capture action — mounted once in AppShell, so it's
 * identical in buyer and owner mode. Defaults its context from the current
 * page (see inferContextFromPath) but the picker inside NoteComposer stays
 * open the whole time. Draft persistence (lib/data/draft.ts) means closing
 * the drawer via Escape/backdrop, or navigating away mid-note, never loses
 * what was typed — only a confirmed save or an explicit "Discard draft"
 * clears it.
 */
export function QuickNote() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const params = useParams<Record<string, string | string[]>>();
  const { notify } = useToast();

  const inferred = inferContextFromPath(pathname ?? "", params ?? {});

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Quick note"
        title="Quick note"
        className="no-print fixed bottom-20 right-4 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-accent text-white shadow-lg transition-transform hover:scale-105 md:bottom-6"
      >
        <PencilIcon />
      </button>

      <Overlay open={open} onClose={() => setOpen(false)} title="Quick note" variant="drawer" size="md">
        <div className="p-4 sm:p-5">
          <NoteComposer
            defaultContext={inferred ?? undefined}
            draftKey={DRAFT_KEY}
            onSaved={() => {
              setOpen(false);
              notify("Note saved.");
            }}
            onCancel={() => setOpen(false)}
          />
        </div>
      </Overlay>
    </>
  );
}

function PencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}
