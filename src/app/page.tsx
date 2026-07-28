import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { PublicWelcomePage } from "@/components/marketing/public-welcome-page";

/**
 * The public root. `/` is listed as a public path in middleware.ts, so it no
 * longer force-redirects a logged-out visitor to /login — this is the actual
 * decision: resolve the session server-side and either send an authenticated
 * visitor straight into the app or render the welcome page.
 *
 * Redirecting to /journey (rather than rendering the app here) intentionally
 * does *not* duplicate the buyer/homeowner or household-onboarding routing —
 * `(app)/layout.tsx`'s `HouseholdProvider` + `WorkspaceGate` already own that
 * decision for every authenticated route, so landing on any of them re-runs
 * the same centralized resolution.
 */
export default async function RootPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/journey");
  }

  return <PublicWelcomePage />;
}
