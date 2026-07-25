import type { Owner, Priority } from "@/lib/models";

export interface SeedTaskDef {
  title: string;
  owner?: Owner;
  priority?: Priority;
}

export interface SeedPhaseDef {
  title: string;
  phaseStart: string; // "YYYY-MM"
  phaseEnd: string;
  tasks: SeedTaskDef[];
}

/** The home-buying timeline, July 2026 → June 2027. All tasks are editable. */
export const TIMELINE_PHASES: SeedPhaseDef[] = [
  {
    title: "July–September 2026",
    phaseStart: "2026-07",
    phaseEnd: "2026-09",
    tasks: [
      { title: "Decide how much of the taxable investment account is available", priority: "high" },
      { title: "Review investment tax lots and capital gains" },
      { title: "Move near-term house funds to lower-volatility holdings" },
      { title: "Determine childcare cost" },
      { title: "Track actual monthly spending" },
      { title: "Define renovation tolerance" },
    ],
  },
  {
    title: "October–December 2026",
    phaseStart: "2026-10",
    phaseEnd: "2026-12",
    tasks: [
      { title: "Monitor attending opportunities", owner: "buyer2" },
      { title: "Improve Buyer 2 credit profile", owner: "buyer2" },
      { title: "Avoid unnecessary new debt" },
      { title: "Research primary and backup towns" },
      { title: "Test weekday and weekend commutes" },
      { title: "Research train-station parking" },
    ],
  },
  {
    title: "January 2027",
    phaseStart: "2027-01",
    phaseEnd: "2027-01",
    tasks: [
      { title: "Obtain signed attending contract", owner: "buyer2", priority: "high" },
      { title: "Review car-loan balances" },
      { title: "Contact physician, conventional, and jumbo lenders", priority: "high" },
      { title: "Identify a real-estate attorney" },
      { title: "Identify inspectors" },
    ],
  },
  {
    title: "February 2027",
    phaseStart: "2027-02",
    phaseEnd: "2027-02",
    tasks: [
      { title: "Obtain strong mortgage preapproval", priority: "high" },
      { title: "Finalize financial guardrails" },
      { title: "Select primary and backup towns" },
      { title: "Begin tracking comparable sales" },
    ],
  },
  {
    title: "March–April 2027",
    phaseStart: "2027-03",
    phaseEnd: "2027-04",
    tasks: [
      { title: "Begin active touring" },
      { title: "Verify assigned schools for every property", priority: "high" },
      { title: "Test real commute" },
      { title: "Review each offer against financial limits", priority: "high" },
    ],
  },
  {
    title: "May–June 2027",
    phaseStart: "2027-05",
    phaseEnd: "2027-06",
    tasks: [
      { title: "Complete attorney review", owner: "attorney" },
      { title: "Complete inspections", owner: "inspector" },
      { title: "Obtain insurance quote" },
      { title: "Preserve required reserves", priority: "high" },
      { title: "Complete final walkthrough" },
      { title: "Close only within predetermined guardrails", priority: "high" },
    ],
  },
];
