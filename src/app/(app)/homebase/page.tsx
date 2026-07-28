import Link from "next/link";
import { Panel } from "@/components/ui";

/**
 * The homeowner default landing page — the homeowner counterpart to /journey
 * for buyers (see getDefaultRouteForMode in lib/workspace/navigation.ts). A
 * placeholder shell by design: no maintenance data model exists yet, so this
 * page orients rather than pretends to track anything. Real maintenance
 * features are explicitly out of scope for this PR.
 */
export default function HomeBasePage() {
  return (
    <div>
      <div className="mb-8">
        <span className="mb-3 inline-flex items-center rounded-full border border-[color:var(--mode-accent-border)] bg-mode-accent-muted px-2.5 py-0.5 text-xs font-medium text-mode-accent">
          Homeowner
        </span>
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Welcome to your HomeBase</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted sm:text-base">
          This is where your home&rsquo;s ongoing care will live — maintenance, warranties, and the
          recurring things that keep a home running. It&rsquo;s just getting started.
        </p>
      </div>

      <div
        className="mb-8 rounded-xl border p-5 sm:p-6"
        style={{
          borderColor: "var(--mode-accent-border)",
          background: "radial-gradient(120% 100% at 0% 0%, var(--mode-accent-glow), transparent 60%)",
        }}
      >
        <h2 className="font-display text-lg text-ink">What&rsquo;s here already</h2>
        <div className="mt-3 flex flex-wrap gap-3">
          <Link
            href="/notes"
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            Notes →
          </Link>
          <Link
            href="/settings"
            className="rounded-lg border border-line bg-surface px-4 py-2.5 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            Settings →
          </Link>
        </div>
      </div>

      <Panel className="p-5 sm:p-6">
        <h2 className="font-display text-lg text-ink">Coming soon</h2>
        <p className="mt-1 text-sm text-ink-muted">
          A calm, homeowner-first set of tools — not a copy of the buyer experience.
        </p>
        <ul className="mt-4 space-y-2 text-sm text-ink-muted">
          <li className="flex items-center gap-2">
            <Dot /> Maintenance tracking, by season and by system
          </li>
          <li className="flex items-center gap-2">
            <Dot /> Warranty and appliance records
          </li>
          <li className="flex items-center gap-2">
            <Dot /> Recurring tasks and reminders
          </li>
        </ul>
      </Panel>
    </div>
  );
}

function Dot() {
  return <span className="inline-block h-1.5 w-1.5 shrink-0 rounded-full bg-mode-accent" aria-hidden />;
}
