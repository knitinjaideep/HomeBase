import type { GuideStage } from "../types";

/**
 * Stages 12–18: the property-specific stages, from preparing an offer through
 * post-closing. Each connects to a single property's deal record.
 */

const offerPrep: GuideStage = {
  id: "offer-prep",
  number: 12,
  title: "Prepare an offer",
  shortTitle: "Offer prep",
  purpose: "Make a deliberate, property-specific decision rather than an emotional one.",
  explanation:
    "This is the moment the guardrails earn their keep. Everything verified now is one less thing decided in the heat of a bidding war.",
  readinessAreas: ["offer"],
  propertySpecific: true,
  warnings: [
    {
      tone: "critical",
      text: "Record the walk-away price before submitting, and keep it private. The app displays it during offer preparation and never raises it because of competition.",
    },
  ],
  personalization: [
    {
      id: "offer-prep.walk-away",
      when: "always",
      text: "Our standing walk-away price is {{walkAwayPrice}}. This house does not change that number — the number decides about this house.",
    },
    {
      id: "offer-prep.reserve",
      when: "always",
      text: "After closing we must still hold at least {{minReserve}}. An offer that breaks that is an offer we cannot afford, whatever the appraisal says.",
    },
  ],
  actions: [
    {
      id: "offer-prep.verify-schools",
      title: "Verify assigned schools for this exact address",
      why: "The single most expensive thing to get wrong, and it is address-specific.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "offer-prep.verify-taxes",
      title: "Verify the property taxes",
      why: "The tax bill drives the monthly payment and is routinely misstated in listings.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "offer-prep.flood",
      title: "Review flood status",
      why: "It affects insurance cost, availability, and resale.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.commute",
      title: "Test the commute from this address",
      why: "At the real hour, with the real parking.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.comps",
      title: "Review comparable sales with our agent",
      why: "Comps anchor the offer to evidence rather than to how much we want the house.",
      defaultOwner: "agent",
      weight: 5,
    },
    {
      id: "offer-prep.payment",
      title: "Calculate the estimated monthly payment",
      why: "Against our comfortable and maximum payment guardrails.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.cash-at-closing",
      title: "Calculate cash needed at closing",
      why: "Down payment, closing costs, prepaids, immediate repairs, and moving all land at once.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.reserve",
      title: "Calculate the post-closing reserve",
      why: "This is the check that a house is affordable, not merely purchasable.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "offer-prep.renovation",
      title: "Enter a renovation estimate",
      why: "A real number — ideally from a contractor — keeps the true cost honest.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "offer-prep.insurance",
      title: "Consider insurance availability and cost",
      why: "An uninsurable house is not a house we can finance.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.disclosures",
      title: "Review the listing disclosures",
      why: "Disclosures often name exactly what the inspection should chase.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.lender-confirm",
      title: "Have our lender confirm this specific scenario",
      why: "Confirm the loan works for this price, this property type, and this county.",
      defaultOwner: "lender",
      weight: 5,
    },
    {
      id: "offer-prep.attorney-ready",
      title: "Confirm which attorney will handle review",
      why: "Attorney review begins within days of an accepted offer.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.appraisal-gap",
      title: "Understand our appraisal-gap exposure",
      why: "Know in advance how much of any shortfall we are willing and able to cover.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.inspection-strategy",
      title: "Document the inspection strategy",
      why: "Decide what we will inspect and how contingencies are framed before we write the offer.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "offer-prep.walk-away",
      title: "Record the private walk-away price",
      why: "The number agreed before negotiating is the one that protects us during it.",
      completionCriteria: "A walk-away price is saved on this property's deal.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "offer-prep.both-approve",
      title: "Both of us approve moving to an offer",
      why: "One largest-purchase-of-our-lives decision deserves two yeses.",
      defaultOwner: "both",
      weight: 8,
    },
  ],
  decisions: [
    {
      id: "offer-prep.walk-away-decision",
      prompt: "What is our walk-away price for this house, and why that number?",
      requiresBothSpouses: true,
    },
    {
      id: "offer-prep.appraisal-gap-decision",
      prompt: "How large an appraisal gap are we willing to cover, if any?",
      requiresBothSpouses: true,
    },
    {
      id: "offer-prep.contingencies",
      prompt: "Which contingencies are we keeping, and which would we waive — and are we comfortable with that?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "agent",
      title: "Offer-strategy questions",
      questions: [
        { id: "offer-prep.q.comps", question: "What do the comparable sales support as a price?" },
        { id: "offer-prep.q.competition", question: "How many offers do you expect, and on what terms?" },
        { id: "offer-prep.q.strengthen", question: "What terms, other than price, would strengthen our offer?" },
        { id: "offer-prep.q.escalation", question: "Do you recommend an escalation clause here, and with what cap?" },
        { id: "offer-prep.q.seller-priorities", question: "What does the seller care about besides price?" },
      ],
    },
    {
      audience: "lender",
      title: "Scenario-confirmation questions",
      questions: [
        { id: "offer-prep.q.works", question: "Does our loan work at this price, property type, and county?" },
        { id: "offer-prep.q.reissue", question: "Can you reissue the preapproval at our offer amount today?" },
        { id: "offer-prep.q.cash", question: "What is the cash-to-close estimate for this scenario?" },
      ],
    },
  ],
  documents: [
    { label: "Seller disclosures", category: "property-disclosures" },
    { label: "Comparable sales analysis", category: "offer" },
    { label: "Scenario-confirmed preapproval at offer amount", category: "preapproval" },
  ],
  resourceSlugs: ["nar-signing-to-closing", "cfpb-owning-a-home"],
  mistakes: [
    "Deciding the walk-away price after falling for the house.",
    "Letting competition, rather than the number we set, raise the offer.",
    "Skipping tax or school verification because the house feels right.",
    "Waiving contingencies without understanding the exposure.",
    "Forgetting that reserves must survive the offer.",
  ],
  completionCriteria: [
    { id: "offer-prep.c.verified", label: "Schools, taxes, flood, and commute are verified", autoCheck: "dealDueDiligenceVerified" },
    { id: "offer-prep.c.numbers", label: "Payment, cash-to-close, and reserve are calculated", autoCheck: "dealNumbersCalculated" },
    { id: "offer-prep.c.walk-away", label: "A walk-away price is recorded", autoCheck: "dealWalkAwaySet" },
    { id: "offer-prep.c.approved", label: "Both of us approve making an offer", autoCheck: "dealBothApprove" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Open the property to prepare its offer." },
    { label: "Financial planner", href: "/finances", description: "Build the offer scenario." },
    { label: "Compare", href: "/compare", description: "Confirm this really is the best option." },
  ],
  order: 12,
  version: 1,
};

const negotiation: GuideStage = {
  id: "negotiation",
  number: 13,
  title: "Offer submitted and negotiation",
  shortTitle: "Negotiation",
  purpose: "Negotiate against the number we set, keeping a clear record of every move.",
  explanation:
    "Every counter is a decision. Writing down the reasoning — not just the number — is what keeps the negotiation rational.",
  readinessAreas: ["offer"],
  propertySpecific: true,
  personalization: [
    {
      id: "negotiation.walk-away",
      when: "always",
      text: "Our walk-away price for this house is {{dealWalkAwayPrice}}. If a counter pushes past it, the answer is already decided.",
    },
  ],
  actions: [
    {
      id: "negotiation.record-initial",
      title: "Record the initial offer and its terms",
      why: "The starting point anchors everything that follows.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "negotiation.escalation",
      title: "Record escalation terms and their cap",
      why: "The cap is the walk-away price expressed as a clause.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "negotiation.earnest",
      title: "Record the earnest money and where it sits",
      why: "It is real money at risk and belongs on the record.",
      defaultOwner: "both",
      weight: 2,
    },
    {
      id: "negotiation.contingencies",
      title: "Record financing, appraisal, and inspection terms",
      why: "These protections matter as much as the price.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "negotiation.concessions-items",
      title: "Record seller concessions and included/excluded items",
      why: "Fixtures and credits change the real price.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "negotiation.log-counters",
      title: "Log every counteroffer with the reasoning",
      why: "The reasoning is what we will want to reread if we are tempted to chase.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "negotiation.final-terms",
      title: "Record the final accepted terms",
      why: "The agreed terms become the checklist for everything downstream.",
      defaultOwner: "both",
      weight: 3,
    },
  ],
  decisions: [
    {
      id: "negotiation.each-counter",
      prompt: "For each counter: do we hold, move, or walk — and why?",
      requiresBothSpouses: true,
    },
    {
      id: "negotiation.final-yes",
      prompt: "Are we genuinely comfortable with the final accepted terms, price and reserves included?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "agent",
      title: "Negotiation questions",
      questions: [
        { id: "negotiation.q.counter-read", question: "What does this counter tell us about the seller's position?" },
        { id: "negotiation.q.non-price", question: "What non-price terms could move this without raising our number?" },
        { id: "negotiation.q.other-offers", question: "What do we actually know about competing offers?" },
        { id: "negotiation.q.deadline", question: "Is this deadline real, or negotiating pressure?" },
      ],
    },
  ],
  documents: [
    { label: "Signed offer and all counters", category: "offer" },
    { label: "Fully executed contract", category: "contract" },
  ],
  resourceSlugs: ["nar-signing-to-closing"],
  mistakes: [
    "Chasing past the walk-away price because we are already invested.",
    "Waiving protections to win, then regretting it at inspection.",
    "Bidding against offers we cannot actually confirm exist.",
    "Not writing down why we accepted or rejected each counter.",
  ],
  completionCriteria: [
    { id: "negotiation.c.final", label: "Final accepted terms are recorded", autoCheck: "dealFinalTermsRecorded" },
    { id: "negotiation.c.log", label: "The negotiation log captures the key moves", autoCheck: "dealNegotiationLogged" },
    { id: "negotiation.c.within", label: "The accepted price is within our walk-away limit", autoCheck: "dealPriceWithinWalkAway" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Deal terms and negotiation log." },
    { label: "Financial planner", href: "/finances", description: "Re-check the payment at the counter price." },
  ],
  order: 13,
  version: 1,
};

const attorneyReview: GuideStage = {
  id: "attorney-review",
  number: 14,
  title: "Attorney review",
  shortTitle: "Attorney review",
  purpose: "Use the New Jersey attorney-review period to make the contract sound.",
  explanation:
    "In New Jersey a signed contract enters a short attorney-review window during which either side's attorney can raise changes or cancel. It moves fast.",
  readinessAreas: ["offer"],
  propertySpecific: true,
  warnings: [
    {
      tone: "caution",
      text: "This app does not provide legal advice. Attorney review is exactly where a real attorney earns their fee.",
    },
  ],
  personalization: [
    {
      id: "attorney-review.no-attorney",
      when: "dealNoAttorney",
      text: "No attorney is recorded on this deal. Attorney review can begin within days of signing — retain someone now.",
    },
  ],
  actions: [
    {
      id: "attorney-review.contract-received",
      title: "Record when the contract was received",
      why: "The review clock starts here.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "attorney-review.retain",
      title: "Retain the attorney",
      why: "The person we lined up in stage 8 now goes to work.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "attorney-review.start",
      title: "Record when review started and its deadline",
      why: "The deadline governs everything in this window.",
      defaultOwner: "attorney",
      weight: 3,
    },
    {
      id: "attorney-review.requested-changes",
      title: "Track requested and agreed changes",
      why: "So nothing agreed verbally is lost before it reaches the contract.",
      defaultOwner: "attorney",
      weight: 5,
    },
    {
      id: "attorney-review.open-issues",
      title: "Track open issues",
      why: "Open issues at the end of review are decisions, not paperwork.",
      defaultOwner: "attorney",
      weight: 3,
    },
    {
      id: "attorney-review.approval",
      title: "Record attorney approval and store the final contract",
      why: "Approval closes the window and locks the terms we will proceed on.",
      completionCriteria: "Attorney approval is recorded and the final contract's location is noted.",
      defaultOwner: "attorney",
      weight: 5,
    },
  ],
  decisions: [
    {
      id: "attorney-review.pursue",
      prompt: "Which contract changes are worth pursuing, and which are we willing to concede?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "attorney",
      title: "Attorney-review questions",
      questions: [
        { id: "attorney-review.q.concerns", question: "What in this contract concerns you, and what do you recommend changing?" },
        { id: "attorney-review.q.contingencies", question: "Are our contingencies and deadlines protective enough?" },
        { id: "attorney-review.q.risks", question: "What are the biggest risks you see in this deal?" },
        { id: "attorney-review.q.timeline", question: "What has to happen, and by when, from here to closing?" },
      ],
    },
  ],
  documents: [
    { label: "Executed contract as received", category: "contract" },
    { label: "Attorney-review correspondence", category: "attorney-review" },
    { label: "Final agreed contract", category: "contract" },
  ],
  resourceSlugs: ["nar-signing-to-closing"],
  mistakes: [
    "Not having an attorney ready when review begins.",
    "Letting the review window lapse without raising known concerns.",
    "Relying on verbal agreement instead of written contract changes.",
    "Treating attorney review as a formality.",
  ],
  completionCriteria: [
    { id: "attorney-review.c.retained", label: "An attorney is retained on this deal", autoCheck: "dealAttorneyRetained" },
    { id: "attorney-review.c.approved", label: "Attorney review is concluded and approved", autoCheck: "dealAttorneyApproved" },
    { id: "attorney-review.c.stored", label: "The final contract's location is recorded", autoCheck: "dealFinalContractStored" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Attorney-review tracking on the deal." },
    { label: "Professionals", href: "/professionals?role=attorney", description: "The attorney's record." },
    { label: "Resource library", href: "/resources", description: "What happens between signing and closing." },
  ],
  order: 14,
  version: 1,
};

const inspections: GuideStage = {
  id: "inspections",
  number: 15,
  title: "Inspections and due diligence",
  shortTitle: "Inspections",
  purpose: "Find out what we are really buying, and decide what to do about it.",
  explanation:
    "Older New Jersey homes reward thorough inspection. The findings drive the next negotiation — for credits, repairs, or walking away.",
  readinessAreas: ["offer"],
  propertySpecific: true,
  personalization: [
    {
      id: "inspections.nj",
      when: "always",
      text: "For this house, prioritise the sewer scope and the underground oil-tank sweep. They are the findings most likely to change the deal.",
    },
  ],
  actions: [
    {
      id: "inspections.schedule",
      title: "Schedule inspections within the contingency window",
      why: "The window is short and specialists book up.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "inspections.general",
      title: "Complete the general home inspection",
      why: "The baseline that flags where the specialists should look.",
      defaultOwner: "inspector",
      weight: 8,
    },
    {
      id: "inspections.sewer",
      title: "Complete the sewer scope",
      why: "A failed lateral is a large, hidden cost a general inspection will not catch.",
      defaultOwner: "inspector",
      weight: 5,
    },
    {
      id: "inspections.oil-tank",
      title: "Complete the underground oil-tank sweep",
      why: "Buried tanks carry remediation liability that can dwarf the inspection cost.",
      defaultOwner: "inspector",
      weight: 5,
    },
    {
      id: "inspections.radon",
      title: "Complete radon testing",
      why: "Common in the region and straightforward to mitigate if caught.",
      defaultOwner: "inspector",
      weight: 3,
    },
    {
      id: "inspections.specialists",
      title: "Follow up on flagged issues with specialists",
      why: "A structural or environmental flag needs an expert opinion, quickly.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "inspections.estimate-repairs",
      title: "Estimate the repair cost for each finding",
      why: "The estimate is what turns findings into a negotiating position.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "inspections.seller-response",
      title: "Request credits or repairs, and record the seller's response",
      why: "This is the second real negotiation of the purchase.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "inspections.resolution",
      title: "Record the resolution or the accepted risk for each item",
      why: "Whatever we accept, we should accept it on purpose and in writing.",
      defaultOwner: "both",
      weight: 5,
    },
  ],
  decisions: [
    {
      id: "inspections.proceed",
      prompt: "Given the findings, do we proceed, renegotiate, or walk away?",
      requiresBothSpouses: true,
    },
    {
      id: "inspections.accepted-risk",
      prompt: "Which issues are we knowingly accepting, and what would they cost to fix later?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "inspector",
      title: "Inspection questions",
      questions: [
        { id: "inspections.q.worst", question: "What are the three most serious things you found?" },
        { id: "inspections.q.safety", question: "Is anything a safety issue we should not live with?" },
        { id: "inspections.q.specialists", question: "What needs a specialist's follow-up?" },
        { id: "inspections.q.costs", question: "Roughly what will the significant items cost to fix?" },
        { id: "inspections.q.maintenance", question: "What routine maintenance has been deferred?" },
      ],
    },
  ],
  documents: [
    { label: "General inspection report", category: "inspection" },
    { label: "Sewer scope report", category: "inspection" },
    { label: "Oil-tank sweep results", category: "inspection" },
    { label: "Radon results", category: "inspection" },
    { label: "Specialist reports", category: "inspection" },
    { label: "Repair or credit request and seller response", category: "inspection" },
  ],
  resourceSlugs: ["nar-signing-to-closing"],
  mistakes: [
    "Skipping the sewer scope or oil-tank sweep to save money.",
    "Missing the inspection window because scheduling started late.",
    "Accepting a serious finding without a repair estimate.",
    "Negotiating repairs verbally instead of in writing.",
    "Being unwilling to walk away after a genuinely bad finding.",
  ],
  completionCriteria: [
    { id: "inspections.c.core", label: "General, sewer, and oil-tank inspections are complete", autoCheck: "dealCoreInspectionsDone" },
    { id: "inspections.c.findings", label: "Findings and estimated repair costs are recorded", autoCheck: "dealFindingsRecorded" },
    { id: "inspections.c.resolved", label: "Each finding has a resolution or accepted-risk decision", autoCheck: "dealFindingsResolved" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Inspection records on the deal." },
    { label: "Inspection checklists", href: "/timeline", description: "Reusable per-type checklists." },
    { label: "Professionals", href: "/professionals?role=home-inspector", description: "The inspection team." },
  ],
  order: 15,
  version: 1,
};

const financing: GuideStage = {
  id: "financing",
  number: 16,
  title: "Finalize financing",
  shortTitle: "Financing",
  purpose: "Turn the preapproval into a cleared-to-close loan without surprises.",
  explanation:
    "This is where the loan becomes real: application, appraisal, underwriting, and the closing disclosure. Compare the actual Loan Estimates, not the earlier promises.",
  readinessAreas: ["offer", "mortgage"],
  propertySpecific: true,
  warnings: [
    {
      tone: "critical",
      text: "Never rely solely on emailed wire instructions. Independently verify closing instructions using a trusted phone number you found yourself, not one from the email.",
    },
  ],
  personalization: [
    {
      id: "financing.wire",
      when: "always",
      text: "When wire instructions arrive, call the title company or attorney on a number we already had — wire fraud in real estate is common and irreversible.",
    },
  ],
  actions: [
    {
      id: "financing.application",
      title: "Submit the full loan application",
      why: "The formal application starts the clock on the real loan.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "financing.loan-estimate",
      title: "Collect the Loan Estimate",
      why: "The standardized form that makes offers genuinely comparable.",
      defaultOwner: "lender",
      weight: 5,
    },
    {
      id: "financing.compare-estimates",
      title: "Compare competing Loan Estimates",
      why: "This is the moment a second lender pays off, or does not.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "financing.select-lender",
      title: "Select the lender and lock the rate",
      why: "Know the lock length and its expiry against the closing date.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "financing.appraisal",
      title: "Complete the appraisal",
      why: "A low appraisal reopens the appraisal-gap question we planned for in stage 12.",
      defaultOwner: "lender",
      weight: 8,
    },
    {
      id: "financing.underwriting",
      title: "Clear underwriting and its conditions",
      why: "Conditions arrive with short deadlines; the document folder pays off here.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "financing.insurance",
      title: "Bind homeowners insurance",
      why: "The loan cannot close without it.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "financing.clear-to-close",
      title: "Reach clear-to-close",
      why: "The green light that closing can be scheduled.",
      defaultOwner: "lender",
      weight: 8,
    },
    {
      id: "financing.closing-disclosure",
      title: "Review the Closing Disclosure carefully",
      why: "Check it against the Loan Estimate; unexplained changes are worth challenging.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "financing.final-cash",
      title: "Confirm the final cash to close",
      why: "The exact figure to have ready, verified against our own math.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "financing.verify-wire",
      title: "Independently verify wire instructions by phone",
      why: "The one anti-fraud step that prevents an irreversible loss.",
      completionCriteria: "Wire instructions confirmed by phone on an independently-found number.",
      defaultOwner: "both",
      weight: 8,
    },
  ],
  decisions: [
    {
      id: "financing.lender-choice",
      prompt: "Which Loan Estimate are we accepting, and why that one?",
      requiresBothSpouses: true,
    },
    {
      id: "financing.appraisal-gap",
      prompt: "If the appraisal comes in low, how do we respond?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "lender",
      title: "Financing questions",
      questions: [
        { id: "financing.q.le-changes", question: "What changed between the Loan Estimate and the Closing Disclosure, and why?" },
        { id: "financing.q.lock", question: "When does the rate lock expire relative to our closing date?" },
        { id: "financing.q.conditions", question: "What conditions are still outstanding, and what do you need from us?" },
        { id: "financing.q.appraisal", question: "What happens if the appraisal is below the contract price?" },
      ],
    },
  ],
  documents: [
    { label: "Loan Estimates from each lender", category: "loan-estimate" },
    { label: "Rate lock confirmation", category: "loan-estimate" },
    { label: "Appraisal report", category: "appraisal" },
    { label: "Homeowners insurance binder", category: "insurance" },
    { label: "Closing Disclosure", category: "closing-disclosure" },
  ],
  resourceSlugs: ["cfpb-owning-a-home", "nar-signing-to-closing"],
  mistakes: [
    "Acting on emailed wire instructions without a verification call.",
    "Not comparing the Loan Estimate against the Closing Disclosure.",
    "Letting the rate lock expire before closing.",
    "Opening new credit during underwriting.",
    "Assuming the appraisal will match the contract price.",
  ],
  completionCriteria: [
    { id: "financing.c.locked", label: "A lender is selected and the rate is locked", autoCheck: "dealRateLocked" },
    { id: "financing.c.ctc", label: "The loan is clear to close", autoCheck: "dealClearToClose" },
    { id: "financing.c.cd", label: "The Closing Disclosure is received and reviewed", autoCheck: "dealClosingDisclosureReviewed" },
    { id: "financing.c.wire", label: "Wire instructions are independently verified by phone", autoCheck: "dealWireVerified" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Financing tracker on the deal." },
    { label: "Lenders", href: "/lenders", description: "Compare the final Loan Estimates." },
    { label: "Financial planner", href: "/finances", description: "Verify the cash to close independently." },
  ],
  order: 16,
  version: 1,
};

const closingPrep: GuideStage = {
  id: "closing-prep",
  number: 17,
  title: "Prepare for closing",
  shortTitle: "Closing prep",
  purpose: "Line up the last details so closing day is uneventful.",
  explanation:
    "The final walkthrough, the funds, and the logistics all converge in the last week. A short checklist prevents a scramble.",
  readinessAreas: ["offer"],
  propertySpecific: true,
  personalization: [],
  actions: [
    {
      id: "closing-prep.walkthrough",
      title: "Schedule the final walkthrough",
      why: "The last chance to confirm condition and that agreed repairs were done.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "closing-prep.utilities",
      title: "Arrange utilities",
      why: "Transfer them for the closing date so we do not arrive to a cold, dark house.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing-prep.moving",
      title: "Arrange moving",
      why: "Good movers book out weeks ahead.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing-prep.funds",
      title: "Get closing funds ready",
      why: "Certified or wired funds take time to arrange; leave margin.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "closing-prep.review-cd",
      title: "Review the Closing Disclosure once more",
      why: "The final numbers should match what we verified.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "closing-prep.identification",
      title: "Get identification ready",
      why: "A trivial thing that stalls a closing table when forgotten.",
      defaultOwner: "both",
      weight: 2,
    },
    {
      id: "closing-prep.confirm-repairs",
      title: "Verify agreed repairs and included items at the walkthrough",
      why: "This is the moment to catch a missing appliance or an undone repair.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "closing-prep.access",
      title: "Confirm keys and access items",
      why: "So we can actually get in after closing.",
      defaultOwner: "both",
      weight: 3,
    },
  ],
  decisions: [
    {
      id: "closing-prep.walkthrough-issue",
      prompt: "If the walkthrough turns up a problem, how do we want it resolved before closing?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "attorney",
      title: "Pre-closing questions",
      questions: [
        { id: "closing-prep.q.funds", question: "Exactly how much do we bring, and in what form?" },
        { id: "closing-prep.q.walkthrough-issue", question: "What are our options if the walkthrough reveals a problem?" },
        { id: "closing-prep.q.documents", question: "What do we need to bring to the closing table?" },
        { id: "closing-prep.q.timeline", question: "What is the order of events on closing day?" },
      ],
    },
  ],
  documents: [
    { label: "Final Closing Disclosure", category: "closing-disclosure" },
    { label: "Proof of homeowners insurance", category: "insurance" },
    { label: "Certified funds or wire confirmation", category: "closing-documents" },
  ],
  resourceSlugs: ["nar-signing-to-closing"],
  mistakes: [
    "Skipping the final walkthrough.",
    "Leaving closing funds to the last day.",
    "Not confirming agreed repairs were actually completed.",
    "Forgetting to transfer utilities.",
  ],
  completionCriteria: [
    { id: "closing-prep.c.walkthrough", label: "The final walkthrough is scheduled", autoCheck: "dealWalkthroughScheduled" },
    { id: "closing-prep.c.funds", label: "Closing funds are ready and their method confirmed", autoCheck: "dealFundsReady" },
    { id: "closing-prep.c.insurance", label: "Homeowners insurance is active", autoCheck: "dealInsuranceActive" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Closing-prep checklist on the deal." },
    { label: "Closing checklist", href: "/timeline", description: "Reusable final-walkthrough and closing lists." },
  ],
  order: 17,
  version: 1,
};

const closing: GuideStage = {
  id: "closing",
  number: 18,
  title: "Closing and post-closing",
  shortTitle: "Closing & after",
  purpose: "Close, then set the new home up to be maintained rather than neglected.",
  explanation:
    "Closing is the finish line for the purchase and the starting line for ownership. A little setup now prevents the first year's avoidable problems.",
  readinessAreas: ["offer"],
  propertySpecific: true,
  personalization: [
    {
      id: "closing.reserve",
      when: "always",
      text: "After closing, confirm we still hold our reserve. It is the number this whole plan was built to protect.",
    },
  ],
  actions: [
    {
      id: "closing.complete",
      title: "Complete the closing and save the final documents",
      why: "Keep the full closing package somewhere safe and findable.",
      defaultOwner: "both",
      weight: 5,
    },
    {
      id: "closing.keys-locks",
      title: "Receive the keys and change the locks",
      why: "We never know who else has a key. Change them day one.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing.utilities",
      title: "Confirm utilities are in our name and working",
      why: "Catch any gap before it becomes a cold weekend.",
      defaultOwner: "both",
      weight: 2,
    },
    {
      id: "closing.shutoffs",
      title: "Locate the emergency shutoffs",
      why: "Water, gas, and electrical shutoffs are worth finding before an emergency, not during one.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing.document-systems",
      title: "Document the home's systems and store the warranties",
      why: "Model numbers, filter sizes, and warranties are painful to reconstruct later.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing.maintenance-calendar",
      title: "Create a maintenance calendar",
      why: "Seasonal maintenance protects the largest purchase we have made.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing.first-payment",
      title: "Record the first mortgage payment and its date",
      why: "Confirm where and when it is due; set it up so it is never late.",
      defaultOwner: "both",
      weight: 3,
    },
    {
      id: "closing.address-changes",
      title: "Complete address changes",
      why: "Registrations, accounts, and mail all need updating.",
      defaultOwner: "both",
      weight: 2,
    },
    {
      id: "closing.verify-reserve",
      title: "Verify the post-closing reserve",
      why: "Confirm the cash cushion the whole plan was built to protect actually survived.",
      completionCriteria: "Actual post-closing reserve is recorded and meets our minimum.",
      defaultOwner: "both",
      weight: 8,
    },
    {
      id: "closing.repair-list",
      title: "Create a 30-day repair list and a one-year maintenance plan",
      why: "Turns the inspection findings into an orderly plan instead of a stressful backlog.",
      defaultOwner: "both",
      weight: 3,
    },
  ],
  decisions: [
    {
      id: "closing.first-projects",
      prompt: "What are the first three things we tackle in the new home, and in what order?",
      requiresBothSpouses: true,
    },
  ],
  questionSets: [
    {
      audience: "ourselves",
      title: "Settling-in review",
      questions: [
        { id: "closing.q.reserve", question: "Did our reserve survive intact?" },
        { id: "closing.q.surprises", question: "What surprised us about the costs, and what should we adjust?" },
        { id: "closing.q.urgent", question: "What genuinely needs doing in the first 30 days?" },
      ],
    },
  ],
  documents: [
    { label: "Full closing package", category: "closing-documents" },
    { label: "Deed and title documents", category: "closing-documents" },
    { label: "Appliance and system warranties", category: "closing-documents" },
  ],
  resourceSlugs: ["hud-buying-a-home"],
  mistakes: [
    "Not changing the locks.",
    "Failing to locate the shutoffs before an emergency.",
    "Losing the warranties and system details.",
    "Not confirming the reserve survived closing.",
    "Letting deferred inspection items pile into a stressful backlog.",
  ],
  completionCriteria: [
    { id: "closing.c.closed", label: "The closing is complete and documents are saved", autoCheck: "dealClosed" },
    { id: "closing.c.reserve", label: "The post-closing reserve is verified", autoCheck: "dealReserveVerified" },
    { id: "closing.c.setup", label: "Locks, shutoffs, and the maintenance plan are handled", autoCheck: "dealHomeSetup" },
  ],
  relatedTools: [
    { label: "This property", href: "/properties", description: "Post-closing checklist on the deal." },
    { label: "Financial planner", href: "/finances", description: "Confirm the reserve figure." },
    { label: "Settings", href: "/settings", description: "Back up everything once you are moved in." },
  ],
  order: 18,
  version: 1,
};

export const TRANSACTION_STAGES: GuideStage[] = [
  offerPrep,
  negotiation,
  attorneyReview,
  inspections,
  financing,
  closingPrep,
  closing,
];
