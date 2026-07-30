"use client";

import { useActionState, useEffect, useId, useRef } from "react";
import { Button, Field, Input } from "@/components/ui";
import { submitPreviewAccessKey, type PreviewAccessState } from "./actions";

const INITIAL_STATE: PreviewAccessState = { error: null };

export function PreviewAccessForm({ returnTo }: { returnTo: string }) {
  const [state, formAction, pending] = useActionState(submitPreviewAccessKey, INITIAL_STATE);
  const inputRef = useRef<HTMLInputElement>(null);
  const errorId = useId();

  // Return focus to the field after a rejected attempt so the visitor can
  // immediately retype, and so assistive tech re-announces the field's
  // updated accessible description (the error message).
  useEffect(() => {
    if (state.error) inputRef.current?.focus();
  }, [state.error]);

  return (
    <form action={formAction} className="mt-6 flex flex-col gap-4">
      <input type="hidden" name="returnTo" value={returnTo} />
      <Field label="Preview access key" htmlFor="preview-access-key">
        <Input
          ref={inputRef}
          id="preview-access-key"
          name="accessKey"
          type="password"
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          required
          autoFocus
          className="!min-h-[44px]"
          aria-invalid={state.error ? true : undefined}
          aria-describedby={state.error ? errorId : undefined}
        />
      </Field>

      <div role="status" aria-live="polite">
        {state.error && (
          <p
            id={errorId}
            className="rounded-lg border border-critical/30 bg-critical/10 px-3.5 py-2.5 text-sm text-ink"
          >
            {state.error}
          </p>
        )}
      </div>

      <Button type="submit" disabled={pending} className="w-full !min-h-[44px]">
        {pending ? "Checking…" : "Continue"}
      </Button>
    </form>
  );
}
