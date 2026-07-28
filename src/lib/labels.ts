import type { Owner, Priority, TaskStatus } from "./models";
import type { PropertyStatus } from "./models";
import type {
  ApprovalKind,
  DocumentCategory,
  DocumentStatus,
  HouseholdRole,
  JourneyStatus,
  ProfessionalRole,
  SelectionStatus,
  TownDesignation,
} from "./models";

/** Human-readable labels for the enums used throughout the UI. */

export const PROPERTY_STATUS_LABELS: Record<PropertyStatus, string> = {
  saved: "Saved",
  researching: "Researching",
  "tour-scheduled": "Tour scheduled",
  visited: "Visited",
  interested: "Interested",
  shortlisted: "Shortlisted",
  "possible-offer": "Possible offer",
  "offer-submitted": "Offer submitted",
  rejected: "Rejected",
  "under-contract": "Under contract",
  eliminated: "Eliminated",
  archived: "Archived",
};

export const PROPERTY_STATUS_ORDER: PropertyStatus[] = [
  "saved",
  "researching",
  "tour-scheduled",
  "visited",
  "interested",
  "shortlisted",
  "possible-offer",
  "offer-submitted",
  "under-contract",
  "rejected",
  "eliminated",
  "archived",
];

export const LISTING_STATUS_LABELS: Record<string, string> = {
  active: "Active",
  pending: "Pending",
  contingent: "Contingent",
  sold: "Sold",
  withdrawn: "Withdrawn",
  "off-market": "Off market",
  unknown: "Unknown",
};

export const PROPERTY_TYPE_LABELS: Record<string, string> = {
  "single-family": "Single-family",
  townhouse: "Townhouse",
  condo: "Condo",
  "multi-family": "Multi-family",
  other: "Other",
};

export const PARKING_LABELS: Record<string, string> = {
  ample: "Ample",
  limited: "Limited",
  "permit-only": "Permit only",
  none: "None",
  unknown: "Unknown",
};

export const TRAFFIC_LABELS: Record<string, string> = {
  low: "Low",
  moderate: "Moderate",
  high: "High",
  unknown: "Unknown",
};

export const OWNER_LABELS: Record<Owner, string> = {
  buyer1: "Me",
  buyer2: "Wife",
  both: "Both",
  agent: "Agent",
  attorney: "Attorney",
  lender: "Lender",
  inspector: "Inspector",
  other: "Other",
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  low: "Low priority",
  medium: "Medium",
  high: "High priority",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  "in-progress": "In progress",
  blocked: "Blocked",
  done: "Done",
  skipped: "Skipped",
};

export const LOAN_TYPE_LABELS: Record<string, string> = {
  physician: "Physician",
  conventional: "Conventional",
  "high-balance-conventional": "High-balance conventional",
  jumbo: "Jumbo",
  fha: "FHA",
  va: "VA",
  other: "Other",
};

export const RENOVATION_LABELS: Record<string, string> = {
  turnkey: "Turnkey only",
  cosmetic: "Cosmetic work",
  moderate: "Moderate renovation",
  major: "Major renovation",
};

// ---- Journey --------------------------------------------------------------

export const JOURNEY_STATUS_LABELS: Record<JourneyStatus, string> = {
  "not-started": "Not started",
  learning: "Learning",
  gathering: "Gathering information",
  "in-progress": "In progress",
  blocked: "Blocked",
  ready: "Ready",
  completed: "Completed",
  revisit: "Revisit required",
  "not-applicable": "Not applicable",
};

/** Which guardrail tone a journey status maps to, for pill colouring. */
export const JOURNEY_STATUS_TONE: Record<JourneyStatus, "positive" | "accent" | "caution" | "neutral"> = {
  "not-started": "neutral",
  learning: "accent",
  gathering: "accent",
  "in-progress": "accent",
  blocked: "caution",
  ready: "positive",
  completed: "positive",
  revisit: "caution",
  "not-applicable": "neutral",
};

export const PROFESSIONAL_ROLE_LABELS: Record<ProfessionalRole, string> = {
  "buyer-agent": "Buyer's agent",
  attorney: "Real-estate attorney",
  lender: "Mortgage lender",
  "home-inspector": "Home inspector",
  "sewer-inspector": "Sewer inspector",
  "oil-tank-sweep": "Oil-tank sweep",
  "radon-inspector": "Radon inspector",
  "structural-engineer": "Structural engineer",
  "insurance-agent": "Insurance agent",
  contractor: "Contractor",
  surveyor: "Surveyor",
  "title-company": "Title company",
  other: "Other",
};

export const SELECTION_STATUS_LABELS: Record<SelectionStatus, string> = {
  candidate: "Candidate",
  interviewed: "Interviewed",
  selected: "Selected",
  "not-selected": "Not selected",
  "no-longer-considering": "No longer considering",
};

export const APPROVAL_KIND_LABELS: Record<ApprovalKind, string> = {
  "readiness-conversation": "Readiness conversation",
  prequalification: "Prequalification",
  preapproval: "Formal preapproval",
  "fully-underwritten": "Fully underwritten",
};

export const APPROVAL_KIND_HINTS: Record<ApprovalKind, string> = {
  "readiness-conversation": "An early chat to understand options. Not an approval.",
  prequalification: "An early estimate based mainly on information you supplied.",
  preapproval: "A substantial lender review, used when preparing to make offers.",
  "fully-underwritten": "The strongest form — reviewed by an underwriter in advance.",
};

export const TOWN_DESIGNATION_LABELS: Record<TownDesignation, string> = {
  considering: "Considering",
  primary: "Primary",
  backup: "Backup",
  "ruled-out": "Ruled out",
};

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  identification: "Identification",
  income: "Income",
  employment: "Employment",
  "attending-contract": "Attending contract",
  taxes: "Taxes",
  "bank-statements": "Bank statements",
  "investment-statements": "Investment statements",
  credit: "Credit",
  preapproval: "Preapproval",
  "lender-quotes": "Lender quotes",
  "buyer-agreement": "Buyer agreement",
  "property-disclosures": "Property disclosures",
  offer: "Offer",
  contract: "Contract",
  "attorney-review": "Attorney review",
  inspection: "Inspection",
  appraisal: "Appraisal",
  insurance: "Insurance",
  "loan-estimate": "Loan Estimate",
  "closing-disclosure": "Closing Disclosure",
  "closing-documents": "Closing documents",
};

export const DOCUMENT_STATUS_LABELS: Record<DocumentStatus, string> = {
  needed: "Needed",
  requested: "Requested",
  gathered: "Gathered",
  submitted: "Submitted",
  "not-applicable": "Not applicable",
};

// ---- Household --------------------------------------------------------

export const HOUSEHOLD_ROLE_LABELS: Record<HouseholdRole, string> = {
  owner: "Owner",
  member: "Member",
};
