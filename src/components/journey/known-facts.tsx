import Link from "next/link";
import { Panel } from "@/components/ui";
import type { JourneyFact } from "@/lib/journey/facts";

export const FACTS_EMPTY_MESSAGE = "As you complete activities, your plan will take shape here.";

/**
 * The fact tiles, each linking to the activity that owns the answer. Renders
 * nothing when there are no facts — callers decide what an empty state looks like.
 */
export function FactList({ facts }: { facts: JourneyFact[] }) {
  if (facts.length === 0) return null;
  return (
    <ul className="grid gap-2 sm:grid-cols-2">
      {facts.map((fact) => (
        <li key={fact.id}>
          <Link
            href={fact.href}
            aria-label={`${fact.label}: ${fact.value}. Edit in ${fact.source}`}
            className="flex min-h-[3.25rem] flex-col justify-center rounded-lg border border-line bg-surface px-3 py-2 hover:border-accent/50"
          >
            <span className="text-xs text-ink-subtle">{fact.label}</span>
            <span className="text-sm font-medium text-ink">{fact.value}</span>
          </Link>
        </li>
      ))}
    </ul>
  );
}

/**
 * "What we know so far" — answers the household has already recorded, each
 * linking to where it can be changed. Nothing is looked up or estimated; an
 * unrecorded answer is simply not shown.
 */
export function KnownFacts({ facts }: { facts: JourneyFact[] }) {
  return (
    <Panel className="p-4 sm:p-5">
      <h2 className="font-display text-lg text-ink">What we know so far</h2>
      <p className="mt-0.5 text-sm text-ink-muted">Key decisions and preferences to guide your journey.</p>
      <div className="mt-4">
        {facts.length === 0 ? (
          <p className="rounded-lg border border-dashed border-line p-3 text-sm text-ink-muted">{FACTS_EMPTY_MESSAGE}</p>
        ) : (
          <FactList facts={facts} />
        )}
      </div>
    </Panel>
  );
}
