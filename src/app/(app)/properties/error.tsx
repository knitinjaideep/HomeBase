"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui";

/**
 * Route-level error boundary for the Homes (Properties) area — covers
 * /properties and /properties/[id]. A last-resort safety net: if a property
 * page throws while rendering, the surrounding app shell stays usable and the
 * user gets a calm, recoverable message instead of a blank screen. It never
 * shows the raw error to the user; details are logged for development only.
 *
 * This is a net, not the fix — the property-form validation bug is handled at
 * the source (see components/property/property-form + lib/property-form).
 */
export default function PropertiesError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Enough to diagnose in server logs / the dev console, nothing in the UI.
    console.error("Properties route error:", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-line bg-surface px-6 py-16 text-center">
      <h1 className="font-display text-xl text-ink">This area could not load</h1>
      <p className="max-w-md text-sm text-ink-muted">
        Something went wrong while loading your homes. Your saved data is safe — this is only a
        display problem. Try again, or head back to the journey.
      </p>
      <div className="mt-2 flex flex-wrap items-center justify-center gap-3">
        <Button onClick={reset}>Try again</Button>
        <Link
          href="/properties"
          className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Back to Homes
        </Link>
        <Link
          href="/"
          className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Go to Journey
        </Link>
      </div>
    </div>
  );
}
