"use client";

import { createContext, useContext, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { seedNewHousehold } from "@/lib/seed/cloud";
import { setCurrentHouseholdId } from "./current";

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
  | { status: "ready"; householdId: string; userEmail: string | null }
  | { status: "error"; message: string };

/**
 * Runs once per sign-in: confirms the session, calls bootstrap_household()
 * (creates a household, or joins one via a pending invite, or returns the
 * existing one), seeds starter content the first time a household is truly
 * new, and exposes the resulting householdId to every data hook below it.
 */
export function HouseholdProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<State>({ status: "loading" });
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    (async () => {
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
      if (bootstrapError || !householdId) {
        setState({
          status: "error",
          message: bootstrapError?.message ?? "Could not set up your household.",
        });
        return;
      }

      const { count, error: countError } = await supabase
        .from("appSettings")
        .select("id", { count: "exact", head: true })
        .eq("householdId", householdId);

      if (countError) {
        setState({ status: "error", message: countError.message });
        return;
      }

      if (!count) {
        const { error: seedError } = await seedNewHousehold(supabase, householdId);
        if (seedError) {
          setState({ status: "error", message: seedError });
          return;
        }
      }

      setCurrentHouseholdId(householdId);
      setState({ status: "ready", householdId, userEmail: user.email ?? null });
    })();
  }, []);

  if (state.status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-fade-in text-ink-subtle">Loading your HomeScope…</div>
      </div>
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
