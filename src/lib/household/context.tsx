"use client";

import { createContext, useContext, useRef, useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { seedNewHousehold } from "@/lib/seed/cloud";
import { createHousehold, redeemFamilyInvite } from "./api";
import { setCurrentHouseholdId } from "./current";
import { HouseholdOnboarding } from "@/components/onboarding/household-onboarding";

interface HouseholdContextValue {
  householdId: string;
  userEmail: string | null;
}

const HouseholdContext = createContext<HouseholdContextValue | null>(null);

export function useHouseholdContext(): HouseholdContextValue {
  const ctx = useContext(HouseholdContext);
  if (!ctx) throw new Error("useHousehold must be used within HouseholdProvider");
  return ctx;
}

type State =
  | { status: "loading" }
  | { status: "onboarding"; userEmail: string | null }
  | { status: "ready"; householdId: string; userEmail: string | null }
  | { status: "error"; message: string };

/**
 * Runs once per sign-in: confirms the session, calls bootstrap_household()
 * to resolve the caller's active household — it never creates one implicitly
 * (see supabase/migrations/0006) — seeds starter content the first time a
 * household is genuinely new, and exposes the resulting householdId to every
 * data hook below it. An authenticated user with no household yet sees the
 * onboarding screen (join via code, or create) instead of any household data;
 * being signed in to Supabase is authentication, not household authorization.
 */
export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const ran = useRef(false);

  /** Seeds starter content only if this household genuinely has none yet. */
  async function seedIfNeeded(householdId: string): Promise<string | null> {
    const supabase = createClient();
    const { count, error: countError } = await supabase
      .from("appSettings")
      .select("id", { count: "exact", head: true })
      .eq("householdId", householdId);
    if (countError) return countError.message;
    if (!count) {
      const { error: seedError } = await seedNewHousehold(supabase, householdId);
      if (seedError) return seedError;
    }
    return null;
  }

  function enterReady(householdId: string, userEmail: string | null) {
    setCurrentHouseholdId(householdId);
    setState({ status: "ready", householdId, userEmail });
  }

  async function resolve() {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      // Middleware already gates every page under (app); this is a
      // defensive fallback in case the session expired mid-session.
      window.location.href = "/login";
      return;
    }

    const { data: householdId, error: bootstrapError } = await supabase.rpc("bootstrap_household");
    if (bootstrapError) {
      setState({ status: "error", message: bootstrapError.message });
      return;
    }

    if (!householdId) {
      setState({ status: "onboarding", userEmail: user.email ?? null });
      return;
    }

    const seedError = await seedIfNeeded(householdId);
    if (seedError) {
      setState({ status: "error", message: seedError });
      return;
    }
    enterReady(householdId, user.email ?? null);
  }

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    resolve();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(name: string, userEmail: string | null) {
    const householdId = await createHousehold(name);
    // A household create_household() just made is always genuinely new.
    const seedError = await seedIfNeeded(householdId);
    if (seedError) {
      setState({ status: "error", message: seedError });
      return;
    }
    enterReady(householdId, userEmail);
  }

  async function handleJoin(code: string, userEmail: string | null) {
    const householdId = await redeemFamilyInvite(code);
    // Never seed a joined household — it already holds the household's real data.
    enterReady(householdId, userEmail);
  }

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-fade-in text-ink-subtle">Loading your HomeScope…</div>
      </div>
    );
  }

  if (state.status === "onboarding") {
    return (
      <HouseholdOnboarding
        onCreate={(name) => handleCreate(name, state.userEmail)}
        onJoin={(code) => handleJoin(code, state.userEmail)}
      />
    );
  }

  if (state.status === "error") {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display text-2xl text-ink">HomeScope could not start</h1>
        <p className="text-ink-muted">{state.message}</p>
        <p className="text-sm text-ink-subtle">
          Check your connection and try reloading. If this keeps happening, the Supabase project
          may be unreachable or misconfigured.
        </p>
      </div>
    );
  }

  return (
    <HouseholdContext.Provider value={{ householdId: state.householdId, userEmail: state.userEmail }}>
      {children}
    </HouseholdContext.Provider>
  );
}
