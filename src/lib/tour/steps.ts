import type { ResolvedMode } from "@/lib/workspace/resolver";

export interface TourStep {
  title: string;
  body: string;
}

/**
 * The six-step first-run tour. Steps 2 and 3 read differently for buyer vs.
 * owner mode (Journey/HomeBase, homes/owned home) since the tour always runs
 * after a mode is already chosen — everything else is shared wording.
 */
export function getTourSteps(mode: ResolvedMode): TourStep[] {
  const buying = mode === "buying";
  return [
    {
      title: buying ? "You're set up as a buyer" : "You're set up as a homeowner",
      body: "Everything here is built around that path. Switch anytime from Settings — nothing you've saved is ever lost.",
    },
    {
      title: buying ? "Journey is your next step" : "HomeBase is your next step",
      body: buying
        ? "Journey walks through each stage of buying, in order, so you always know what's next."
        : "HomeBase shows what your home needs next — nothing is scheduled until you add it.",
    },
    {
      title: buying ? "Add the homes you're considering" : "Add your home",
      body: buying
        ? "Save any home you're looking at — an address is enough to start."
        : "Start with your home's basics, then record the first maintenance item you want to remember.",
    },
    {
      title: "Capture notes from anywhere",
      body: "The pencil button in the corner opens a quick note from any page — an observation, question, decision, or follow-up.",
    },
    {
      title: "Documents stay connected",
      body: "Upload a document once and attach it to the home, visit, or item it belongs to — never a loose pile.",
    },
    {
      title: "Toolkit, when you need it",
      body: "Extra tools — lenders, professionals, comparisons — live in Toolkit. You won't need it until a step actually calls for it.",
    },
  ];
}
