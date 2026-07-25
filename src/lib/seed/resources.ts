import type { Resource } from "@/lib/models";
import { newId } from "@/lib/util";

/**
 * The curated resource library. Primary sources first: federal government, then
 * New Jersey government and regulators, then established consumer-education and
 * professional organizations. We store only a link, our own short summary, and
 * action-oriented notes — never a copy of the article.
 *
 * The `slug` is a stable key that guide stages reference via `resourceSlugs`.
 * Every seeded resource can be edited, archived, or reported outdated by the
 * household, and can be reset from Settings.
 */
export interface SeedResource {
  slug: string;
  title: string;
  organization: string;
  url: string;
  topic: string;
  stageIds: string[];
  description: string;
  whyUseful: string;
  publisherKind: Resource["publisherKind"];
}

export const SEED_RESOURCES: SeedResource[] = [
  {
    slug: "hud-buying-a-home",
    title: "Buying a Home",
    organization: "U.S. Department of Housing and Urban Development (HUD)",
    url: "https://www.hud.gov/helping-americans/buying-a-home",
    topic: "General home-buying process",
    stageIds: ["strategy", "town-research", "active-search", "touring", "closing"],
    description: "The federal overview of the home-buying process, start to finish.",
    whyUseful: "A neutral government starting point with no product to sell.",
    publisherKind: "federal-government",
  },
  {
    slug: "cfpb-owning-a-home",
    title: "Buying a House: Tools and Resources",
    organization: "Consumer Financial Protection Bureau (CFPB)",
    url: "https://www.consumerfinance.gov/owning-a-home/",
    topic: "General home-buying and mortgage process",
    stageIds: ["strategy", "finances", "mortgage-options", "preapproval", "financing"],
    description: "CFPB's hub of unbiased mortgage and home-buying tools.",
    whyUseful: "Built by a federal consumer regulator specifically to counter sales pressure.",
    publisherKind: "federal-government",
  },
  {
    slug: "cfpb-prepare-to-shop",
    title: "Preparing to Shop for Your Mortgage",
    organization: "Consumer Financial Protection Bureau (CFPB)",
    url: "https://www.consumerfinance.gov/owning-a-home/prepare/",
    topic: "Mortgage preparation",
    stageIds: ["finances", "mortgage-options", "lender-interviews"],
    description: "How to get finances and documents ready before applying.",
    whyUseful: "Concrete, checklist-style guidance from a federal regulator.",
    publisherKind: "federal-government",
  },
  {
    slug: "cfpb-preapproval-letter",
    title: "Get a Preapproval Letter",
    organization: "Consumer Financial Protection Bureau (CFPB)",
    url: "https://www.consumerfinance.gov/owning-a-home/explore/get-a-preapproval-letter/",
    topic: "Preapproval",
    stageIds: ["preapproval", "active-search"],
    description: "What a preapproval is, and what it is not.",
    whyUseful: "Directly addresses the myth that a preapproval is a spending budget.",
    publisherKind: "federal-government",
  },
  {
    slug: "cfpb-explore-loan-choices",
    title: "Explore Loan Choices",
    organization: "Consumer Financial Protection Bureau (CFPB)",
    url: "https://www.consumerfinance.gov/owning-a-home/explore/",
    topic: "Loan options",
    stageIds: ["mortgage-options", "lender-interviews"],
    description: "Compares loan types and structures without recommending one.",
    whyUseful: "Explains tradeoffs rather than steering toward a single product.",
    publisherKind: "federal-government",
  },
  {
    slug: "cfpb-prequal-vs-preapproval",
    title: "Prequalification vs. Preapproval",
    organization: "Consumer Financial Protection Bureau (CFPB)",
    url: "https://www.consumerfinance.gov/ask-cfpb/whats-the-difference-between-a-prequalification-letter-and-a-preapproval-letter-en-127/",
    topic: "Preapproval",
    stageIds: ["lender-interviews", "preapproval"],
    description: "The difference between a prequalification and a preapproval letter.",
    whyUseful: "Clarifies exactly the distinction the guide asks us to track.",
    publisherKind: "federal-government",
  },
  {
    slug: "nj-rec-licensee-search",
    title: "Real Estate Licensee Search",
    organization: "New Jersey Department of Banking and Insurance",
    url: "https://www.nj.gov/dobi/division_rec/licensing/online_Instructions/licSearch.html",
    topic: "Verifying a real-estate agent",
    stageIds: ["agent-selection", "professional-team"],
    description: "The official New Jersey lookup for real-estate licence status.",
    whyUseful: "The authoritative source for whether an agent is licensed in New Jersey.",
    publisherKind: "nj-government",
  },
  {
    slug: "nar-questions-buyers-agent",
    title: "Ten Questions to Ask a Buyer's Agent",
    organization: "National Association of REALTORS®",
    url: "https://www.nar.realtor/the-facts/consumer-guide-ten-questions-to-ask-a-buyers-agent",
    topic: "Choosing an agent",
    stageIds: ["agent-selection"],
    description: "A consumer guide to interviewing a buyer's agent.",
    whyUseful: "Useful checklist — treat as an industry resource, not neutral advice.",
    publisherKind: "professional-organization",
  },
  {
    slug: "nar-written-buyer-agreements",
    title: "Written Buyer Agreements",
    organization: "National Association of REALTORS®",
    url: "https://www.nar.realtor/the-facts/consumer-guide-to-written-buyer-agreements",
    topic: "Buyer representation agreements",
    stageIds: ["agent-selection"],
    description: "What written buyer-agency agreements cover and why they exist.",
    whyUseful: "Explains the agreement we must read before signing; an industry source.",
    publisherKind: "professional-organization",
  },
  {
    slug: "nar-agency-relationships",
    title: "Agency and Non-Agency Relationships",
    organization: "National Association of REALTORS®",
    url: "https://www.nar.realtor/the-facts/consumer-guide-agency-and-non-agency-relationships",
    topic: "Agency relationships",
    stageIds: ["agent-selection", "touring"],
    description: "How agency relationships work, including who the listing agent represents.",
    whyUseful: "Clarifies that the listing agent works for the seller; an industry source.",
    publisherKind: "professional-organization",
  },
  {
    slug: "nar-signing-to-closing",
    title: "Steps Between Signing and Closing",
    organization: "National Association of REALTORS®",
    url: "https://www.nar.realtor/the-facts/consumer-guide-steps-between-signing-and-closing-on-a-home",
    topic: "Closing process",
    stageIds: ["offer-prep", "attorney-review", "inspections", "financing", "closing-prep", "professional-team"],
    description: "An overview of what happens between an accepted offer and closing.",
    whyUseful: "A helpful map of the closing sequence; an industry, not legal, source.",
    publisherKind: "professional-organization",
  },
];

/** Build seeded Resource rows for an empty database. */
export function seedResources(ts: string): Resource[] {
  const date = ts.slice(0, 10);
  return SEED_RESOURCES.map((r) => ({
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
    title: r.title,
    organization: r.organization,
    url: r.url,
    topic: r.topic,
    stageIds: r.stageIds,
    description: r.description,
    whyUseful: r.whyUseful,
    publisherKind: r.publisherKind,
    dateAdded: date,
    lastReviewedDate: date,
    status: "active" as const,
    notes: "",
    isFavorite: false,
    isSeeded: true,
  }));
}
