import Link from "next/link";

interface Tool {
  label: string;
  href: string;
  description: string;
}

interface ToolGroup {
  title: string;
  tools: Tool[];
}

const GROUPS: ToolGroup[] = [
  {
    title: "Money",
    tools: [
      { label: "Financial planner", href: "/finances", description: "Affordability, mortgage math, and saved scenarios." },
      { label: "Lender quotes", href: "/lenders", description: "Compare rates, fees, and terms side by side." },
      { label: "Preapprovals", href: "/lenders?tab=approvals", description: "Track each approval from conversation to underwritten." },
    ],
  },
  {
    title: "Homes",
    tools: [
      { label: "Compare homes", href: "/compare", description: "Two to five properties, side by side." },
      { label: "Town & school research", href: "/journey/town-research", description: "Commute, taxes, and school assignment by town." },
    ],
  },
  {
    title: "People",
    tools: [
      { label: "Buyer's agent", href: "/professionals?role=buyer-agent", description: "Candidates, interviews, and scorecards." },
      { label: "Attorney", href: "/professionals?role=attorney", description: "Retained for attorney review." },
      { label: "Inspectors", href: "/professionals?role=home-inspector", description: "General, sewer, oil-tank, and radon." },
      { label: "All professionals", href: "/professionals", description: "The full team directory." },
    ],
  },
  {
    title: "Planning",
    tools: [
      { label: "Timeline", href: "/timeline?tab=timeline", description: "Everything in date order." },
      { label: "Checklists", href: "/timeline?tab=checklists", description: "Reusable task lists for any phase." },
      { label: "Documents", href: "/timeline?tab=documents", description: "What exists, and where it lives." },
      { label: "Resources", href: "/resources", description: "Curated primary-source reading." },
    ],
  },
];

export default function ToolkitPage() {
  return (
    <div>
      <div className="mb-8">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Toolkit</h1>
        <p className="mt-2 text-sm text-ink-muted sm:text-base">
          Calculators, comparisons, and research — when you need them.
        </p>
      </div>

      <div className="space-y-8">
        {GROUPS.map((group) => (
          <section key={group.title}>
            <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{group.title}</h2>
            <div className="divide-y divide-line rounded-xl border border-line bg-surface">
              {group.tools.map((tool) => (
                <Link
                  key={tool.href}
                  href={tool.href}
                  className="flex items-center justify-between gap-4 px-4 py-3.5 hover:bg-surface-muted"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-ink">{tool.label}</div>
                    <div className="mt-0.5 text-xs text-ink-subtle">{tool.description}</div>
                  </div>
                  <ChevronRight />
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function ChevronRight() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="shrink-0 text-ink-subtle"
      aria-hidden
    >
      <path d="m9 6 6 6-6 6" />
    </svg>
  );
}
