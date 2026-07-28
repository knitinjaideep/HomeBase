"use client";

import { useState } from "react";
import { Button, Callout, Field, Input, Panel } from "@/components/ui";

type Mode = "choice" | "join" | "create";

/**
 * Shown when an authenticated user has no household yet — being signed in
 * to Supabase is authentication, not household authorization (see
 * HouseholdProvider). Deliberately does not auto-create anything.
 */
export function HouseholdOnboarding({
  onCreate,
  onJoin,
}: {
  onCreate: (name: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
}) {
  const [mode, setMode] = useState<Mode>("choice");
  const [code, setCode] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function backToChoice() {
    setMode("choice");
    setError(null);
  }

  async function submitJoin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onJoin(code);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not join that household.");
      setBusy(false);
    }
  }

  async function submitCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await onCreate(name.trim());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create a household.");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl text-ink">Welcome to HomeScope</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {mode === "choice" &&
            "Join your household's existing HomeScope, or start a new one."}
          {mode === "join" && "Enter the invitation code your household member sent you."}
          {mode === "create" && "Give your household a name — you can change it later."}
        </p>
      </div>

      <Panel className="p-6">
        {mode === "choice" && (
          <div className="flex flex-col gap-3">
            <Button onClick={() => setMode("join")} className="w-full">
              Join a household
            </Button>
            <Button variant="secondary" onClick={() => setMode("create")} className="w-full">
              Create a household
            </Button>
          </div>
        )}

        {mode === "join" && (
          <form onSubmit={submitJoin} className="flex flex-col gap-4">
            <Field label="Invitation code" htmlFor="invite-code">
              <Input
                id="invite-code"
                autoFocus
                required
                autoComplete="off"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="K7FD-M9QX-4R2P"
              />
            </Field>
            {error && <Callout tone="critical">{error}</Callout>}
            <Button type="submit" disabled={busy || !code.trim()} className="w-full">
              {busy ? "Joining…" : "Join household"}
            </Button>
            <button
              type="button"
              onClick={backToChoice}
              className="text-center text-xs text-ink-subtle hover:text-ink"
            >
              Back
            </button>
          </form>
        )}

        {mode === "create" && (
          <form onSubmit={submitCreate} className="flex flex-col gap-4">
            <Field label="Household name" htmlFor="household-name">
              <Input
                id="household-name"
                autoFocus
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Our Household"
              />
            </Field>
            {error && <Callout tone="critical">{error}</Callout>}
            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating…" : "Create household"}
            </Button>
            <button
              type="button"
              onClick={backToChoice}
              className="text-center text-xs text-ink-subtle hover:text-ink"
            >
              Back
            </button>
          </form>
        )}
      </Panel>

      <p className="mt-6 text-center text-xs text-ink-subtle">
        Already have an invitation code from your household? Choose &ldquo;Join a
        household&rdquo; instead of creating a new one.
      </p>
    </div>
  );
}
