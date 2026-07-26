import { createBrowserClient } from "@supabase/ssr";

/**
 * The browser Supabase client. Uses only the public URL and anon/publishable
 * key — safe to ship to the client. Never import a service-role key here.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
  );
}
