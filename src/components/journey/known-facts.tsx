import Link from "next/link";
import { Panel } from "@/components/ui";
import type { JourneyFact } from "@/lib/journey/facts";

/**
 * "What we know so far" — answers the household has already recorded, each
 * linking to where it can be changed. Nothing is looked up or estimated; an
 * unrecorded answer is simply not shown.
 */
export function KnownFacts({ facts }: { facts: JourneyFact[] }) {
  return (
    <Panel className="p-4 sm:p-5">
      <div className="flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg text-ink">What we know so far</h2>
          <p className="mt-0.5 text-sm text-ink-muted">Key decisions and preferences to guide your journey.</p>
        </div>
        <Link
          href="/settings"
          className="inline-flex min-h-[2.5rem] shrink-0 items-center rounded-lg border border-line px-3 text-sm text-ink hover:border-accent/50 hover:text-accent"
        >
          Edit details
        </Link>
      </div>

      {facts.length === 0 ? (
        <p className="mt-4 rounded-lg border border-dashed border-line p-3 text-sm text-ink-muted">
          Nothing recorded yet. The timeline, price range, towns, and preferences you save will appear here.
        </p>
      ) : (
        <ul className="mt-4 grid gap-2 sm:grid-cols-2">
          {facts.map((fact) => (
            <li key={fact.id}>
              <Link
                href={fact.href}
                className="flex min-h-[3.25rem] flex-col justify-center rounded-lg border border-line bg-surface px-3 py-2 hover:border-accent/50"
              >
                <span className="text-xs text-ink-subtle">{fact.label}</span>
                <span className="text-sm font-medium text-ink">{fact.value}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
