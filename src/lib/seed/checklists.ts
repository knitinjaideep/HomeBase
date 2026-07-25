export interface SeedChecklistDef {
  title: string;
  category: string;
  description?: string;
  tasks: string[];
}

/** Reusable checklist templates. Editable; users can add their own tasks. */
export const CHECKLIST_TEMPLATES: SeedChecklistDef[] = [
  {
    title: "Town research",
    category: "town",
    description: "Confirm the fundamentals of a town before touring in it.",
    tasks: [
      "Verify school district ratings and record the source",
      "Confirm assigned schools for the specific streets of interest",
      "Test a weekday commute at rush hour",
      "Test a weekend commute",
      "Research train-station parking availability and cost",
      "Review property-tax trends",
      "Walk the neighborhood at different times of day",
      "Check FEMA flood maps for the area",
    ],
  },
  {
    title: "Property research",
    category: "property",
    description: "Desk research before or right after finding a listing.",
    tasks: [
      "Confirm asking price and days on market",
      "Look up tax history",
      "Confirm assigned schools by exact address",
      "Check listing and prior-sale history",
      "Review lot lines / survey if available",
      "Note HOA details, if any",
      "Estimate homeowners insurance",
    ],
  },
  {
    title: "Home tour",
    category: "tour",
    description: "Use alongside Visit mode during the showing.",
    tasks: [
      "Complete Visit-mode notes",
      "Photograph any concerns",
      "Check water pressure",
      "Test a sample of light switches and outlets",
      "Look for water stains on ceilings and walls",
      "Smell for musty or damp odors",
      "Open and close a few windows",
      "Note cell signal inside the house",
      "Ask the agent the prepared questions",
    ],
  },
  {
    title: "Offer preparation",
    category: "offer",
    description: "Line up the decision before submitting an offer.",
    tasks: [
      "Confirm recent comparable sales",
      "Set an offer price against the financial guardrails",
      "Decide which contingencies to include",
      "Confirm financing type and preapproval",
      "Confirm attorney availability",
      "Confirm the inspection plan",
      "Review estimated cash to close",
    ],
  },
  {
    title: "Attorney review",
    category: "legal",
    tasks: [
      "Send the signed contract to the attorney",
      "Review the attorney-review letter",
      "Negotiate repairs or credits",
      "Confirm the closing date",
      "Review the title commitment",
    ],
  },
  {
    title: "General inspection",
    category: "inspection",
    tasks: [
      "Schedule a licensed inspector",
      "Attend the inspection",
      "Review the full report",
      "Prioritize the findings",
      "Get repair estimates for major items",
    ],
  },
  {
    title: "Sewer scope",
    category: "inspection",
    tasks: [
      "Schedule a sewer-line camera scope",
      "Review the video with the inspector",
      "Note any root intrusion or cracks",
      "Estimate repair cost if needed",
    ],
  },
  {
    title: "Underground oil-tank sweep",
    category: "inspection",
    tasks: [
      "Order an underground tank sweep",
      "Review the results",
      "If a tank is found, plan removal and soil testing",
    ],
  },
  {
    title: "Radon",
    category: "inspection",
    tasks: [
      "Place a radon test (48+ hours)",
      "Collect and review results",
      "Plan mitigation if levels are elevated",
    ],
  },
  {
    title: "Mold and moisture",
    category: "inspection",
    tasks: [
      "Inspect basement and attic",
      "Check around windows and under sinks",
      "Note any humidity or standing water",
      "Estimate remediation if needed",
    ],
  },
  {
    title: "Roof",
    category: "inspection",
    tasks: [
      "Note roof age and material",
      "Look for missing or curling shingles",
      "Check flashing and gutters",
      "Get a roofer estimate if concerns exist",
    ],
  },
  {
    title: "HVAC",
    category: "inspection",
    tasks: [
      "Note furnace and AC age",
      "Confirm servicing records",
      "Test heating and cooling",
      "Estimate replacement timing",
    ],
  },
  {
    title: "Electrical",
    category: "inspection",
    tasks: [
      "Check the panel capacity",
      "Note any knob-and-tube or aluminum wiring",
      "Confirm GFCIs in wet areas",
      "Get an electrician estimate if needed",
    ],
  },
  {
    title: "Plumbing",
    category: "inspection",
    tasks: [
      "Note supply-pipe material",
      "Check the water-heater age",
      "Look for leaks under fixtures",
      "Test drainage speed",
    ],
  },
  {
    title: "Foundation",
    category: "inspection",
    tasks: [
      "Inspect for cracks inside and out",
      "Check for signs of water intrusion",
      "Note grading and drainage away from the house",
      "Consult a structural engineer if concerned",
    ],
  },
  {
    title: "Flood risk",
    category: "risk",
    tasks: [
      "Check the FEMA flood zone",
      "Ask the seller about any prior flooding",
      "Get a flood-insurance quote if in or near a zone",
    ],
  },
  {
    title: "Homeowners insurance",
    category: "insurance",
    tasks: [
      "Get at least two quotes",
      "Confirm coverage limits and deductibles",
      "Ask about the property's claims history (CLUE report)",
      "Confirm replacement-cost coverage",
    ],
  },
  {
    title: "Final walkthrough",
    category: "closing",
    tasks: [
      "Confirm agreed repairs were completed",
      "Test major appliances",
      "Check for any new damage",
      "Confirm nothing contracted-for was removed",
      "Verify utilities are on",
    ],
  },
  {
    title: "Closing",
    category: "closing",
    tasks: [
      "Confirm cash to close and verify wire instructions by phone",
      "Review the closing disclosure line by line",
      "Bring government-issued ID",
      "Preserve the required post-closing reserves",
      "Collect the keys",
    ],
  },
];
