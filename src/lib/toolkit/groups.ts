import type { ResolvedMode } from "@/lib/workspace/resolver";

export interface ToolkitTool {
  label: string;
  href: string;
  description: string;
}

export interface ToolkitGroup {
  title: string;
  tools: ToolkitTool[];
}

/**
 * Buyer Toolkit — unchanged in spirit from the pre-redesign version: every
 * tile links to a real, already-existing feature. "Affordability & mortgage
 * planner" intentionally covers both of the task's "Affordability worksheet"
 * and "Mortgage calculator" examples with one tile, since /finances is
 * already the single tool that does both — a second tile pointing at the
 * same page would be a fabricated distinction, not a second feature.
 */
export const BUYER_TOOLKIT_GROUPS: ToolkitGroup[] = [
  {
    title: "Money",
    tools: [
      { label: "Affordability & mortgage planner", href: "/finances", description: "Affordability, mortgage math, and saved scenarios." },
      { label: "Lender quote comparison", href: "/lenders", description: "Compare rates, fees, and terms side by side." },
      { label: "Preapproval tracker", href: "/lenders?tab=approvals", description: "Track each approval from conversation to underwritten." },
    ],
  },
  {
    title: "Homes",
    tools: [
      { label: "Compare homes", href: "/compare", description: "Two to five properties, side by side." },
      { label: "Town and school research", href: "/journey/town-research", description: "Commute, taxes, and school assignment by town." },
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
      { label: "Documents", href: "/documents", description: "Every buyer document, organized and searchable." },
      { label: "Resources", href: "/resources", description: "Curated primary-source reading." },
    ],
  },
];

/**
 * Owner Toolkit. Everything either links to a real existing feature
 * (Maintenance, Repairs, Documents — with a query param that changes what's
 * shown, so no two tiles share an identical destination) or to one of the 5
 * new lightweight notes contexts added for tools with no natural home yet
 * (see lib/models/note.ts's noteContextTypeSchema and
 * supabase/migrations/0026) — deliberately not 5 bespoke pages.
 */
export const OWNER_TOOLKIT_GROUPS: ToolkitGroup[] = [
  {
    title: "Maintenance",
    tools: [
      { label: "Maintenance schedule", href: "/maintenance?tab=maintenance", description: "Recurring and one-time tasks, sorted by urgency." },
      { label: "Seasonal checklist", href: "/notes?context=seasonalChecklist:", description: "Freeform seasonal task notes — mow, gutters, HVAC prep." },
      { label: "Repair log", href: "/maintenance?tab=repairs", description: "Every repair and small project, with cost and status." },
    ],
  },
  {
    title: "Home records",
    tools: [
      { label: "Warranty tracker", href: "/documents?category=warranty", description: "Warranties, sorted by what's expiring soonest." },
      { label: "Home document organizer", href: "/documents", description: "Every home record in one organized place." },
      { label: "Home inventory notes", href: "/notes?context=homeInventory:", description: "Freeform notes on what's in the home and its condition." },
    ],
  },
  {
    title: "Planning",
    tools: [
      { label: "Project cost worksheet", href: "/notes?context=projectCostWorksheet:", description: "Cost notes that pair with the estimated/actual cost fields on each repair project." },
      { label: "Contractor comparison notes", href: "/notes?context=contractorNotes:", description: "Compare contractor quotes and impressions in one place." },
      { label: "Annual home review", href: "/notes?context=annualReview:", description: "A yearly check-in: what changed, what's next." },
    ],
  },
];

export function toolkitGroupsForMode(mode: ResolvedMode): ToolkitGroup[] {
  return mode === "owning" ? OWNER_TOOLKIT_GROUPS : BUYER_TOOLKIT_GROUPS;
}
