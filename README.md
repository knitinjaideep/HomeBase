# HomeScope

A private, local-only, **step-by-step home-buying guide** for two people buying a home in New Jersey, leading from July 2026 through a May–June 2027 closing. It is a calm digital companion — not a marketplace, lender, or advice platform.

The **Journey** is the organizing structure of the app. At every step it helps answer:

1. Where are we in the process?
2. What should we do next, and why does it matter?
3. What information or decision is required, and who is responsible?
4. Which resources and which app tool support this step?
5. What mistakes should we avoid, and are we ready to proceed?

Property tracking, financial scenarios, lender quotes, professional contacts, town research, documents, and decisions all connect to the relevant stage of the journey. Every figure is an **estimate for personal planning** — not financial, legal, or tax advice.

---

## The guided journey

Eighteen editable stages, from strategy to closing. Each is defined as versioned TypeScript content (`src/lib/guide`), separate from the household's stored progress, so guide wording can be revised without losing state:

1. Define our home-buying strategy · 2. Prepare our finances · 3. Prepare for the attending-income transition · 4. Learn mortgage options · 5. Interview lenders · 6. Obtain preapproval · 7. Find & interview buyer's agents · 8. Build the professional team · 9. Research towns & schools · 10. Begin the active search · 11. Tour & evaluate properties · 12. Prepare an offer · 13. Negotiation · 14. Attorney review · 15. Inspections & due diligence · 16. Finalize financing · 17. Prepare for closing · 18. Closing & post-closing.

Every guided step page follows the same shape: **what it accomplishes · why it matters for us** (personalized from the household profile) **· actions · decisions · questions to ask · documents · resources · mistakes to avoid · completion criteria · related tools.**

## Navigation

- **Journey** *(landing page)* — current stage, weighted overall progress, target closing window, next recommended actions, blocking items, decisions awaiting input, recently completed milestones, five readiness meters (financial, mortgage, team, search, offer), and the full 18-stage roadmap. The former dashboard's key figures live here.
- **Properties** — add / edit / archive / restore / delete, per-property cost estimates, guardrail banding, missing-info flags, a printable report, and a per-property **deal** covering stages 12–18 (offer readiness, negotiation log, attorney review, inspections, financing, closing prep, post-closing) with a prominent private **walk-away price**.
- **Compare** — 2–5 properties side by side; most-favorable cell marked per row (never an automatic winner).
- **Finances** — a transparent mortgage & cash planner with named, duplicable scenarios.
- **Lenders** — a quote tracker plus a separate **approvals** tab that distinguishes readiness conversation → prequalification → formal preapproval → fully underwritten. Never ranked by rate alone.
- **Professionals** — a role-based directory with interview banks, agent licence/experience verification, an agent scorecard, and a deliberate select-one-per-role workflow.
- **Timeline** — the plan and reusable checklists, plus a **documents index** (records that a document exists and where it lives; no files are stored).
- **Resources** — a curated library of primary-source links (federal, NJ, regulator, then established organizations), each with our own summary, a "report outdated" action, and a restore-curated-set option.
- **Settings** — the household planning profile that personalizes the whole guide.

## Personalized next-action engine

A deterministic, rules-based engine (no AI) reads the household snapshot and surfaces recommendations — critical, warning, or suggestion. Each states **why it appeared, which stored information triggered it, and what would clear it** — never an opaque score. Examples: an offer exceeding the walk-away price, attending income relied upon without written lender confirmation, touring without a preapproval, or a shortlisted home missing verified taxes/schools/commute.

Progress is **weighted**, not a raw task count: signing an attending contract counts far more than reading a resource. Readiness is described in words ("Lender interviews started; attending-contract eligibility not confirmed"), never a blunt single percentage.

## Explicit non-goals

This app deliberately does **not** include: a chatbot or any LLM/AI features, RAG, vector databases, Zillow/MLS scraping, live real-estate or rate APIs, bank-account connections, document OCR/extraction, file uploads, accounts/authentication, a backend or cloud sync, a native mobile app, microservices, or decorative charts. It is not a blog, course, or encyclopedia. It never shows a blunt "you can afford this" verdict, never blocks saving a property that exceeds a limit, and never claims to replace a lender, attorney, tax professional, inspector, insurance professional, or real-estate agent.

---

## Tech stack

- **Next.js 15** (App Router, client-rendered — there is no server or API)
- **TypeScript** (strict)
- **Tailwind CSS 3**
- **React Hook Form** for forms
- **Zod** for schemas and import validation
- **Dexie** (IndexedDB) for persistent structured data; `localStorage` only for small UI preferences (theme, compare selection/notes)
- **Vitest** for tests

No backend, no login, no paid services, no external APIs. Next.js anonymous CLI telemetry has been disabled for this project.

## Local setup

```bash
npm install
npm run dev      # http://localhost:3000
```

On first run the app seeds your planning profile, three clearly-marked **SAMPLE** properties, the timeline, and the reusable checklists.

## Commands

```bash
npm run dev         # start the dev server
npm run build       # production build
npm run start       # serve the production build
npm run lint        # ESLint
npm run typecheck   # tsc --noEmit
npm test            # Vitest (unit + persistence integration)
```

---

## Data storage

All data lives **only in this browser**, in IndexedDB (via Dexie). There is no account and nothing is uploaded anywhere.

> ⚠️ Browser storage is not a guaranteed-safe place. Clearing site data, some private-browsing modes, or switching devices/browsers will lose it. **Export a backup regularly.** A reminder appears when no backup exists or the last one is over two weeks old.

### Backup & restore

- **Export** (Settings → Data & backups, or the reminder banner) downloads a timestamped `homescope-backup-YYYY-MM-DD-HHMM.json` containing everything.
- **Import** validates the file with Zod first, shows a **preview of counts**, and warns that importing **replaces all current data**. A local **pre-import snapshot** is saved automatically so you can roll back.
- **Printable reports:** a single property (Properties → property → *Print report*) and the shortlist comparison (Compare → *Print comparison*).

---

## Calculation assumptions

All calculations live in tested pure functions under `src/lib/calculations/` and are labeled as estimates in the UI.

- **Mortgage payment** uses the standard fixed-rate amortization formula
  `M = P · r(1+r)ⁿ / ((1+r)ⁿ − 1)`, degrading to straight-line principal at a 0% rate.
- **Lender-style monthly payment** = principal & interest + property taxes/12 + insurance/12 + HOA + mortgage insurance (PMI).
- **PMI** is estimated only when the down payment is under 20% (default 0.6%/yr of the loan). It can be turned off (e.g. physician loans).
- **Real monthly ownership cost** = lender-style payment + maintenance reserve + optional utilities + optional commute difference + optional renovation savings. Maintenance defaults to 1%/yr of value.
- **Cash required at closing** = down payment + closing costs + prepaid/escrow + immediate renovation + moving. **Retirement funds are never counted as available closing cash by default.**
- **Reserves** are compared against an editable minimum and preferred target.
- **DTI / income shares** are planning estimates, not lender underwriting.
- **Guardrail bands** classify a value against your thresholds as *Within comfortable range → Above comfortable range → Near maximum → Beyond walk-away limit*, or *Missing information* when an input is absent. Warnings are calm and factual and never block saving.
- **Lender 5-year figures** sum interest over the first 60 scheduled payments; upfront cost = points (as dollars) + flat fees.
- **Overall property score** is a transparent weighted average of your 1–5 ratings; unrated items are omitted, not counted as zero.
- **School data** is treated as research only — never derived from a town name. You record the assigned schools, source, verified date, rating/metric, notes, and a confidence rating, with a standing reminder that boundaries and ratings change and must be independently verified.

Defaults used when a property leaves a field blank: property taxes fall to the entered value or 0; insurance ≈ 0.35% of price; escrow/prepaids ≈ 3 months of taxes + insurance; closing costs ≈ 2.5% of price; rate/term/maintenance fall back to your Settings defaults.

---

## Project structure

```
src/
  app/                      # App Router pages (all client-rendered)
    page.tsx                # Journey overview (landing)
    journey/[stageId]/      # guided step pages (18 stages)
    properties/             # list + [id] detail (+ per-property deal)
    visit/[id]/             # Visit mode
    professionals/ resources/
    compare/ finances/ lenders/ timeline/ settings/
    layout.tsx globals.css
  components/
    ui.tsx                  # primitives (Button, Panel, Field, BandPill, …)
    journey/                # StatusPill, ProgressBar, StepSection, action &
                            #   decision rows, recommendation card, trackers
    professional/ documents/ property/deal-section.tsx lender/approvals.tsx
    modal.tsx toast.tsx app-nav.tsx app-shell.tsx providers.tsx …
  lib/
    calculations/           # tested pure functions (mortgage, closing, dti,
                            #   guardrails, ownership, lender, score, summary)
    guide/                  # the 18-stage guide CONTENT (versioned TS, not data):
                            #   types, stages/{planning,team,transaction}, index
    journey/                # the ENGINES over stored state (pure, tested):
                            #   snapshot, criteria (autoChecks), personalization,
                            #   progress (weighted), next-actions, use-snapshot
    models/                 # Zod schemas + inferred types (incl. journey,
                            #   professional, resource, document, deal)
    seed/                   # editable profile, samples, timeline, checklists,
                            #   curated resources, attending singleton; ensureSeeded()
    db.ts hooks.ts repo.ts  # Dexie DB (v2), reactive reads, write helpers
    backup.ts               # export / validated import / snapshot
    property-finance.ts finance-presets.ts lender-estimate.ts
    format.ts labels.ts util.ts
```

The distinction between `lib/guide` (content) and `lib/journey` (engines over saved state) is deliberate: editing guide wording never orphans a household's progress, because state rows are keyed by the stable content ids.

### Tested behavior

`npm test` covers the calculation core (mortgage payment, cumulative interest, closing cash, reserves, DTI, guardrail classification, the combined plan evaluation, comparison, lender estimates, the overall score), JSON export/import validation, and a **persistence integration test** (real Dexie against an in-memory IndexedDB) confirming seeding — including the v2 journey tables — is idempotent across reloads and that export → wipe → import round-trips without loss. A **journey engine suite** verifies guide-content integrity (18 unique stages, globally-unique action/decision ids, an attending contract weighted far above reading a resource), deterministic `autoCheck` criteria (guardrails, childcare, the attending-timing risk, distinct-lender counting, visit-before-Primary), weighted progress and descriptive readiness, the next-action rules (including the critical walk-away-exceeded warning), and personalization token substitution.

---

## Known limitations

- Data is single-device and single-browser. Your backups are the only copy.
- Estimates use simplified defaults (insurance, escrow, PMI, maintenance). Confirm real numbers with your lender, attorney, and insurer.
- School information is only as good as what you record and verify.
- The document index records only that a document exists and where it lives — no files are stored, and sensitive documents deliberately stay out of browser storage.
- No photos or calendar integration (by design).
- The buyer owner labels default to “Me” / “Wife”; names shown in Settings are editable, but the task-owner labels use the defaults.

## Suggested future enhancements (not part of the MVP, not implemented)

These are intentionally out of scope and would be added later, if ever:

- Shared, encrypted cloud synchronization between two devices
- Secure document storage (inspection reports, disclosures)
- Photo attachments per property and per visit
- Calendar integration for showings and deadlines
- Optional market-data import for comparable sales
- Inspection-document organization
```
