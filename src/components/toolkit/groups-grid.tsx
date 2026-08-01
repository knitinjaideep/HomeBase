import Link from "next/link";
import type { ToolkitGroup } from "@/lib/toolkit/groups";

/** Pure/prop-driven rendering of a mode's Toolkit groups — no hooks, directly unit-testable. */
export function ToolkitGroupsGrid({ groups }: { groups: ToolkitGroup[] }) {
  return (
    <div className="space-y-8">
      {groups.map((group) => (
        <section key={group.title}>
          <h2 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-subtle">{group.title}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {group.tools.map((tool) => (
              <Link
                key={tool.href}
                href={tool.href}
                className="flex flex-col gap-1 rounded-xl border border-line bg-surface px-4 py-3.5 hover:bg-surface-muted"
              >
                <span className="text-sm font-medium text-ink">{tool.label}</span>
                <span className="text-xs text-ink-subtle">{tool.description}</span>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
