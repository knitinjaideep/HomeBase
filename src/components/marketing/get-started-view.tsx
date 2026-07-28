"use client";

import { useState } from "react";
import Link from "next/link";
import type { WorkspaceMode } from "@/lib/models";
import { writeProvisionalPath } from "@/lib/workspace/provisional-path";
import { Button } from "@/components/ui";
import { PathSelectionCards } from "@/components/workspace/path-cards";

/**
 * /get-started for a logged-out visitor. Reuses PR 2's `PathSelectionCards`
 * as-is (same component the post-signup and "Change path" flows use) rather
 * than a second copy with different wording. The choice is stored via
 * `writeProvisionalPath` — a per-device hint only — then the visitor
 * continues to the existing sign-in page, which already doubles as sign-up
 * (Supabase OTP with `shouldCreateUser: true`). `WorkspaceGate` reads the
 * hint back after the account/household exist to pre-select the same step
 * instead of asking twice.
 *
 * Navigates with a plain `window.location` assignment rather than
 * `useRouter()` — the same fallback Next.js navigation `HouseholdProvider`
 * already uses — since this is a one-way handoff into the login/sign-up page,
 * not an in-app transition.
 */
export function GetStartedView() {
  const [mode, setMode] = useState<WorkspaceMode | null>(null);

  function handleContinue() {
    if (!mode) return;
    writeProvisionalPath(mode);
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen bg-canvas">
      <div className="mx-auto flex min-h-screen w-full max-w-4xl flex-col px-4 py-10 sm:px-6 sm:py-14">
        <div className="mb-8 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-medium text-ink-muted hover:text-ink">
            ← Back
          </Link>
          <Link href="/login" className="text-sm font-medium text-accent hover:underline">
            Already have an account? Log in
          </Link>
        </div>

        <div className="animate-fade-in">
          <h1 className="max-w-2xl font-display text-3xl leading-tight text-ink sm:text-4xl">
            How are you using HomeScope?
          </h1>
          <p className="mt-3 max-w-xl text-base text-ink-muted">
            Choose where you’re starting today. You can switch anytime after you sign in — nothing
            is lost when you do.
          </p>

          <div className="mt-8">
            <PathSelectionCards value={mode} onChange={setMode} />
          </div>

          <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
            <Button onClick={handleContinue} disabled={!mode} className="sm:min-w-[10rem]">
              Continue
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
