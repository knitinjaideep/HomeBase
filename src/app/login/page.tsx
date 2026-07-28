"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button, Callout, Field, Input, Panel } from "@/components/ui";
import { readProvisionalPath } from "@/lib/workspace/provisional-path";
import { cn } from "@/lib/util";
import type { WorkspaceMode } from "@/lib/models";

type Step = "email" | "code";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/";

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resent, setResent] = useState(false);
  // Read-only echo of the /get-started choice (if any) — purely reassurance
  // that it wasn't lost on the handoff to this page; WorkspaceGate is what
  // actually applies it after sign-in.
  const [provisionalMode, setProvisionalMode] = useState<WorkspaceMode | null>(null);

  useEffect(() => {
    setProvisionalMode(readProvisionalPath());
  }, []);

  async function requestCode(): Promise<boolean> {
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: {
        shouldCreateUser: true,
        // If the user clicks the emailed link instead of typing the code, it
        // lands on /auth/callback for the PKCE exchange.
        emailRedirectTo: `${window.location.origin}/auth/callback${
          redirectTo !== "/" ? `?redirectTo=${encodeURIComponent(redirectTo)}` : ""
        }`,
      },
    });
    if (error) {
      setError(error.message);
      return false;
    }
    return true;
  }

  async function sendCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const ok = await requestCode();
    setBusy(false);
    if (ok) setStep("code");
  }

  async function resendCode() {
    setError(null);
    setResent(false);
    setBusy(true);
    const ok = await requestCode();
    setBusy(false);
    if (ok) setResent(true);
  }

  async function verifyCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const supabase = createClient();
    const { error } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: code.trim(),
      type: "email",
    });
    setBusy(false);
    if (error) {
      setError(error.message);
      return;
    }
    router.push(redirectTo);
    router.refresh();
  }

  function useDifferentEmail() {
    setStep("email");
    setCode("");
    setError(null);
    setResent(false);
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-10">
      <div className="mb-8 text-center">
        <h1 className="font-display text-2xl text-ink">HomeScope</h1>
        <p className="mt-2 text-sm text-ink-muted">
          A private home-buying tracker for your household.
        </p>
        {provisionalMode && (
          <span
            className={cn(
              "mt-3 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium",
              provisionalMode === "buying" ? "bg-accent-soft text-accent" : "bg-caution/15 text-caution",
            )}
          >
            Continuing as {provisionalMode === "buying" ? "a buyer" : "a homeowner"}
          </span>
        )}
      </div>

      <Panel className="p-6">
        {step === "email" ? (
          <form onSubmit={sendCode} className="flex flex-col gap-4">
            <Field label="Email" htmlFor="email">
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </Field>
            {error && <Callout tone="critical">{error}</Callout>}
            <Button type="submit" disabled={busy || !email.trim()} className="w-full">
              {busy ? "Sending…" : "Send sign-in code"}
            </Button>
            <p className="text-center text-xs text-ink-subtle">
              We&rsquo;ll email you a verification code and a sign-in link — use whichever is
              easier on this device.
            </p>
          </form>
        ) : (
          <form onSubmit={verifyCode} className="flex flex-col gap-4">
            <p className="text-sm text-ink-muted">
              Enter the verification code sent to{" "}
              <span className="font-medium text-ink">{email}</span>.
            </p>
            <Field label="Code" htmlFor="code">
              <Input
                id="code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                autoFocus
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, ""));
                  setResent(false);
                }}
                placeholder="123456"
              />
            </Field>
            {error && <Callout tone="critical">{error}</Callout>}
            {resent && !error && <Callout tone="info">A new code is on its way.</Callout>}
            <Button type="submit" disabled={busy || !code.trim()} className="w-full">
              {busy ? "Verifying…" : "Verify and sign in"}
            </Button>
            <div className="flex items-center justify-center gap-3 text-xs text-ink-subtle">
              <button
                type="button"
                onClick={resendCode}
                disabled={busy}
                className="hover:text-ink disabled:opacity-50"
              >
                Resend code
              </button>
              <span aria-hidden>·</span>
              <button type="button" onClick={useDifferentEmail} className="hover:text-ink">
                Use a different email
              </button>
            </div>
          </form>
        )}
      </Panel>

      <p className="mt-6 text-center text-xs text-ink-subtle">
        Your data is private to your household. All figures are estimates for personal planning,
        not professional advice.
      </p>
    </div>
  );
}
