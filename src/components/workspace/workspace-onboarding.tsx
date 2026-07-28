"use client";

import { useState } from "react";
import type { BuyerModeProfile, OwnerModeProfile, WorkspaceMode } from "@/lib/models";
import { finishBuyerOnboarding, finishOwnerOnboarding } from "@/lib/workspace/service";
import { Button } from "@/components/ui";
import { PathSelectionCards } from "./path-cards";
import { BuyerOnboardingForm, type BuyerOnboardingValues } from "./buyer-onboarding-form";
import { OwnerOnboardingForm, type OwnerOnboardingValues } from "./owner-onboarding-form";

/**
 * The full path-selection + lightweight onboarding experience. Two short
 * steps: choose a path, then one compact profile step. Nothing is persisted
 * until the profile step is submitted — so an abandoned flow leaves the
 * workspace `unselected` and the gate simply shows it again, and a completed
 * flow writes the mode + profile atomically (see completeBuyerOnboarding).
 *
 * Presentation only lives here; the actual writes go through the service. The
 * same component powers the first-run gate and the "Change path" screen — the
 * latter passes `initial*` values to pre-fill and an `onCancel` to back out.
 */

type Step = "path" | "buyer" | "owner";

export function WorkspaceOnboarding({
  onComplete,
  onCancel,
  initialMode = null,
  initialBuyer,
  initialOwner,
}: {
  onComplete: (mode: WorkspaceMode) => void;
  onCancel?: () => void;
  initialMode?: WorkspaceMode | null;
  initialBuyer?: BuyerModeProfile | null;
  initialOwner?: OwnerModeProfile | null;
}) {
  const [step, setStep] = useState<Step>("path");
  const [mode, setMode] = useState<WorkspaceMode | null>(initialMode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function goToProfileStep() {
    if (!mode) return;
    setError(null);
    setStep(mode === "buying" ? "buyer" : "owner");
  }

  async function submitBuyer(values: BuyerOnboardingValues) {
    setBusy(true);
    setError(null);
    try {
      await finishBuyerOnboarding(values);
      onComplete("buying");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your selection.");
      setBusy(false);
    }
  }

  async function submitOwner(values: OwnerOnboardingValues) {
    setBusy(true);
    setError(null);
    try {
      await finishOwnerOnboarding(values);
      onComplete("owning");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your selection.");
      setBusy(false);
    }
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-canvas">
      <BackdropGlow />
      <div className="relative mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-4 py-12 sm:px-6 sm:py-16">
        <div className="animate-fade-in">
          <div className="mb-8 flex items-center justify-between">
            <span className="font-display text-sm tracking-wide text-ink-muted">HomeScope</span>
            {onCancel && (
              <Button variant="ghost" size="sm" onClick={onCancel} disabled={busy}>
                Cancel
              </Button>
            )}
          </div>

          {step === "path" ? (
            <PathStep
              mode={mode}
              onChange={setMode}
              onContinue={goToProfileStep}
            />
          ) : (
            <ProfileStep
              title={step === "buyer" ? "A little about your search" : "A little about your home"}
              subtitle={
                step === "buyer"
                  ? "Two quick choices so guidance and wording fit how you’re buying. You can change these later."
                  : "Two quick choices so guidance and wording fit your home. You can change these later."
              }
            >
              {step === "buyer" ? (
                <BuyerOnboardingForm
                  initial={initialBuyer ?? undefined}
                  onSubmit={submitBuyer}
                  onBack={() => setStep("path")}
                  busy={busy}
                  error={error}
                />
              ) : (
                <OwnerOnboardingForm
                  initial={initialOwner ?? undefined}
                  onSubmit={submitOwner}
                  onBack={() => setStep("path")}
                  busy={busy}
                  error={error}
                />
              )}
            </ProfileStep>
          )}
        </div>
      </div>
    </div>
  );
}

function PathStep({
  mode,
  onChange,
  onContinue,
}: {
  mode: WorkspaceMode | null;
  onChange: (mode: WorkspaceMode) => void;
  onContinue: () => void;
}) {
  return (
    <div>
      <h1 className="max-w-2xl font-display text-3xl leading-tight text-ink sm:text-4xl">
        Your home journey, organized in one place.
      </h1>
      <p className="mt-3 max-w-xl text-base text-ink-muted">
        Choose where you’re starting. You can switch paths anytime in Settings — nothing you’ve
        saved is lost when you do.
      </p>

      <div className="mt-8">
        <PathSelectionCards value={mode} onChange={onChange} />
      </div>

      <div className="mt-6 rounded-xl border border-line bg-surface/70 px-4 py-3 text-sm leading-relaxed text-ink-muted">
        <span className="font-medium text-ink">Private, and yours.</span> HomeScope never fills in
        home values, lender details, maintenance history, or documents for you — you record what
        matters, and it stays in your household’s private space.
      </div>

      <div className="mt-8 flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
        <Button onClick={onContinue} disabled={!mode} className="sm:min-w-[10rem]">
          Continue
        </Button>
      </div>
    </div>
  );
}

function ProfileStep({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto w-full max-w-xl">
      <h1 className="font-display text-2xl text-ink sm:text-3xl">{title}</h1>
      <p className="mt-2 text-sm text-ink-muted sm:text-base">{subtitle}</p>
      <div className="mt-7 rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-7">
        {children}
      </div>
    </div>
  );
}

/** Decorative depth for the premium landing — soft tinted glows, both themes. */
function BackdropGlow() {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{
        background:
          "radial-gradient(55% 45% at 18% 0%, rgb(var(--accent) / 0.12), transparent 70%), radial-gradient(50% 45% at 92% 12%, rgb(var(--caution) / 0.10), transparent 72%)",
      }}
    />
  );
}
