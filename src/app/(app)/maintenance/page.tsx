import Link from "next/link";
import { Panel, EmptyState } from "@/components/ui";

/**
 * Placeholder only — per this PR's scope, maintenance features themselves
 * are not implemented here, just the destination and its place in the
 * homeowner nav (see lib/workspace/navigation.ts).
 */
export default function MaintenancePage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Maintenance</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
          Tracking for your home&rsquo;s systems, seasonal tasks, and warranties.
        </p>
      </div>

      <Panel className="p-5 sm:p-6">
        <EmptyState
          title="Maintenance tracking is coming soon"
          description="This will hold your home's recurring tasks (filters, gutters, HVAC service), appliance and system warranties, and a simple history of what's been done and when. Until then, jot anything down in Notes so it isn't lost."
          action={
            <Link
              href="/notes"
              className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Go to Notes
            </Link>
          }
        />
      </Panel>
    </div>
  );
}
