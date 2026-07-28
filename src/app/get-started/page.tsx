import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GetStartedView } from "@/components/marketing/get-started-view";

/**
 * /get-started — public, listed in middleware.ts. Same shape as the root
 * page: resolve the session server-side first. An already-authenticated
 * visitor is sent straight into the app (their real mode, or WorkspaceGate's
 * path-selection if they somehow still need it) rather than being asked to
 * choose again here.
 */
export default async function GetStartedPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/journey");
  }

  return <GetStartedView />;
}
