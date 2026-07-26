-- HomeScope — core schema
-- Household/auth tables, all household-owned application data, indexes, and
-- the updatedAt trigger. Row Level Security is enabled here but policies are
-- defined in 0002_functions.sql (they depend on the is_household_member
-- helper function, which is defined there too) and 0003_policies.sql.
--
-- Column names intentionally match the existing TypeScript/Zod field names
-- exactly (camelCase, quoted) so `someSchema.parse(row)` works unchanged on
-- Supabase query results with no translation layer.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- Households
-- ---------------------------------------------------------------------------

create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null default 'Our Household',
  "localMigrationCompletedAt" timestamptz,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now()
);

create table household_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  unique (household_id, user_id)
);
create index household_members_user_id_idx on household_members(user_id);
create index household_members_household_id_idx on household_members(household_id);

create table household_invites (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households(id) on delete cascade,
  email text not null,
  created_by uuid not null references auth.users(id),
  "createdAt" timestamptz not null default now(),
  accepted_at timestamptz
);
create index household_invites_email_idx on household_invites(lower(email));
create index household_invites_household_id_idx on household_invites(household_id);

-- ---------------------------------------------------------------------------
-- Singletons (one row per household)
-- ---------------------------------------------------------------------------

create table "buyerProfile" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "planningDate" text not null,
  "idealPurchaseStart" text not null,
  "idealPurchaseEnd" text not null,
  "minOwnershipYears" numeric not null default 0,
  "buyer1Name" text not null default '',
  "buyer2Name" text not null default '',
  "buyer1Income" jsonb not null default '{}'::jsonb,
  "buyer2Income" jsonb not null default '{}'::jsonb,
  "buyer2FutureIncome" jsonb not null default '{}'::jsonb,
  "combinedMonthlyTakeHome" numeric,
  "buyer1CreditScore" integer,
  "buyer2CreditScore" integer,
  notes text not null default ''
);

create table "financialProfile" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  checking numeric,
  savings numeric,
  "taxableInvestments" numeric,
  "retirementAccounts" numeric,
  "designatedDownPaymentCash" numeric,
  "minReserve" numeric,
  "preferredReserve" numeric,
  "retirementAvailableForPurchase" numeric,
  "vehicleBalanceRemaining" numeric,
  "carPaymentsAndInsuranceMonthly" numeric,
  "otherTransportMonthly" numeric,
  "studentLoansMonthly" numeric,
  "otherDebtMonthly" numeric,
  "groceriesMonthly" numeric,
  "diningShoppingMonthly" numeric,
  "insuranceMonthly" numeric,
  "retirementContributionMonthly" numeric,
  "espcontributionMonthly" numeric,
  "childcareMonthly" numeric,
  "travelMonthly" numeric,
  "priceComfortableMin" numeric,
  "priceComfortableMax" numeric,
  "priceRoutineCeiling" numeric,
  "priceAbsoluteCeiling" numeric,
  "paymentComfortable" numeric,
  "paymentMaxTarget" numeric,
  "paymentAbsoluteCeiling" numeric,
  "planningInterestRatePct" numeric not null default 0,
  "defaultLoanTermYears" numeric not null default 30,
  "defaultMaintenancePct" numeric not null default 1
);

create table "homePreferences" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "primaryTowns" text[] not null default '{}',
  "backupTowns" text[] not null default '{}',
  "minSchoolRating" numeric not null default 0,
  "minBedrooms" numeric not null default 0,
  "minBathrooms" numeric not null default 0,
  "requiredNotes" text not null default '',
  "preferredNotes" text not null default '',
  "dealbreakerNotes" text not null default '',
  "maxCommuteMinutes" numeric not null default 0,
  "renovationTolerance" text not null default 'moderate'
    check ("renovationTolerance" in ('turnkey','cosmetic','moderate','major')),
  "renovationDecided" boolean not null default false
);

create table "appSettings" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "schemaVersion" integer not null default 2,
  seeded boolean not null default false,
  "lastBackupAt" timestamptz
);

-- ---------------------------------------------------------------------------
-- Properties, visits, deals
-- ---------------------------------------------------------------------------

create table properties (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  address text not null,
  town text not null default '',
  zip text not null default '',
  "listingUrl" text not null default '',
  "mlsNumber" text not null default '',
  "listingStatus" text not null default 'unknown'
    check ("listingStatus" in ('active','pending','contingent','sold','withdrawn','off-market','unknown')),
  "dateAdded" text not null,
  "showingDate" text,
  "askingPrice" numeric,
  "offerPrice" numeric,
  "finalSalePrice" numeric,
  "annualPropertyTaxes" numeric,
  bedrooms numeric,
  bathrooms numeric,
  "squareFootage" numeric,
  "lotSize" text not null default '',
  "yearBuilt" integer,
  "hoaMonthly" numeric,
  "propertyType" text not null default 'single-family'
    check ("propertyType" in ('single-family','townhouse','condo','multi-family','other')),
  "daysOnMarket" integer,
  schools jsonb not null default '{}'::jsonb,
  "distanceToStation" text not null default '',
  "stationName" text not null default '',
  parking text not null default 'unknown'
    check (parking in ('ample','limited','permit-only','none','unknown')),
  "driveToStationMinutes" numeric,
  "doorToDoorCommuteMinutes" numeric,
  "neighborhoodNotes" text not null default '',
  "floodZoneNotes" text not null default '',
  "roadNoise" text not null default '',
  "trafficLevel" text not null default 'unknown'
    check ("trafficLevel" in ('low','moderate','high','unknown')),
  ratings jsonb not null default '{}'::jsonb,
  notes text not null default '',
  finance jsonb not null default '{}'::jsonb,
  status text not null default 'saved' check (status in (
    'saved','researching','tour-scheduled','visited','interested','shortlisted',
    'possible-offer','offer-submitted','rejected','under-contract','eliminated','archived'
  )),
  "isSample" boolean not null default false,
  "isArchived" boolean not null default false,
  "archivedAt" timestamptz
);
create index properties_household_id_idx on properties("householdId");
create index properties_status_idx on properties(status);
create index properties_town_idx on properties(town);
create index properties_is_archived_idx on properties("isArchived");

create table "propertyVisits" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "propertyId" uuid not null references properties(id) on delete cascade,
  "visitDate" text not null,
  "firstImpression" smallint check ("firstImpression" between 1 and 5),
  "neighborhoodFeeling" smallint check ("neighborhoodFeeling" between 1 and 5),
  "streetTraffic" smallint check ("streetTraffic" between 1 and 5),
  noise smallint check (noise between 1 and 5),
  "naturalLight" smallint check ("naturalLight" between 1 and 5),
  layout smallint check (layout between 1 and 5),
  kitchen smallint check (kitchen between 1 and 5),
  "primaryBedroom" smallint check ("primaryBedroom" between 1 and 5),
  "closetSpace" smallint check ("closetSpace" between 1 and 5),
  bathrooms smallint check (bathrooms between 1 and 5),
  backyard smallint check (backyard between 1 and 5),
  basement smallint check (basement between 1 and 5),
  storage smallint check (storage between 1 and 5),
  "wfhSuitability" smallint check ("wfhSuitability" between 1 and 5),
  "childSafety" smallint check ("childSafety" between 1 and 5),
  "visibleWaterDamage" text not null default '',
  "mustySmells" text not null default '',
  "foundationConcerns" text not null default '',
  "roofConcerns" text not null default '',
  "hvacConcerns" text not null default '',
  "electricalConcerns" text not null default '',
  "plumbingConcerns" text not null default '',
  "windowCondition" text not null default '',
  "immediateRepairs" text not null default '',
  "questionsForAgent" text not null default '',
  "wouldHaveToBeTrue" text not null default '',
  "stillWantAfterExcitement" text not null default '',
  "buyer1Review" jsonb not null default '{}'::jsonb,
  "buyer2Review" jsonb not null default '{}'::jsonb
);
create index property_visits_household_id_idx on "propertyVisits"("householdId");
create index property_visits_property_id_idx on "propertyVisits"("propertyId");
create index property_visits_visit_date_idx on "propertyVisits"("visitDate");

-- ---------------------------------------------------------------------------
-- Finances
-- ---------------------------------------------------------------------------

create table "mortgageScenarios" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  name text not null,
  "propertyId" uuid references properties(id) on delete set null,
  "purchasePrice" numeric not null,
  "downPaymentMode" text not null default 'percent' check ("downPaymentMode" in ('dollars','percent')),
  "downPaymentValue" numeric not null,
  "mortgageRatePct" numeric not null,
  "loanTermYears" numeric not null,
  "annualPropertyTaxes" numeric not null,
  "annualInsurance" numeric not null,
  "monthlyHoa" numeric not null,
  "includePmi" boolean not null default true,
  "pmiRatePct" numeric not null default 0.6,
  "closingCosts" numeric not null,
  "prepaidEscrow" numeric not null,
  "immediateRenovation" numeric not null,
  "movingBudget" numeric not null,
  "maintenancePct" numeric not null,
  "utilitiesMonthly" numeric not null,
  "commutingDeltaMonthly" numeric not null,
  "renovationAllocationMonthly" numeric not null,
  "availableFunds" numeric not null,
  "minReserve" numeric not null,
  "preferredReserve" numeric not null,
  "grossMonthlyIncome" numeric not null,
  "takeHomeMonthlyIncome" numeric not null,
  "monthlyDebts" numeric not null,
  "childcareMonthly" numeric not null,
  "assumptionNote" text not null default ''
);
create index mortgage_scenarios_household_id_idx on "mortgageScenarios"("householdId");
create index mortgage_scenarios_property_id_idx on "mortgageScenarios"("propertyId");

create table "lenderQuotes" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  lender text not null,
  contact text not null default '',
  "loanType" text not null default 'conventional'
    check ("loanType" in ('physician','conventional','high-balance-conventional','jumbo','fha','va','other')),
  "quoteDate" text,
  "purchasePrice" numeric,
  "loanAmount" numeric,
  "downPayment" numeric,
  "interestRatePct" numeric,
  "aprPct" numeric,
  "rateType" text not null default 'fixed' check ("rateType" in ('fixed','adjustable')),
  "loanTermYears" numeric,
  points numeric,
  "lenderFees" numeric,
  "estimatedClosingCosts" numeric,
  "hasPmi" boolean,
  "reserveRequirement" text not null default '',
  "contractIncomeEligible" boolean,
  "maxMonthsBeforeStart" numeric,
  "prepaymentPenalty" boolean,
  "rateLockDays" numeric,
  notes text not null default ''
);
create index lender_quotes_household_id_idx on "lenderQuotes"("householdId");
create index lender_quotes_loan_type_idx on "lenderQuotes"("loanType");

-- ---------------------------------------------------------------------------
-- Checklists, tasks, towns
-- ---------------------------------------------------------------------------

create table checklists (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  title text not null,
  kind text not null default 'template' check (kind in ('timeline','template')),
  "phaseStart" text,
  "phaseEnd" text,
  description text not null default '',
  category text not null default '',
  "order" integer not null default 0
);
create index checklists_household_id_idx on checklists("householdId");

create table "checklistTasks" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "checklistId" uuid not null references checklists(id) on delete cascade,
  title text not null,
  status text not null default 'todo' check (status in ('todo','in-progress','blocked','done','skipped')),
  "dueDate" text,
  owner text not null default 'both'
    check (owner in ('buyer1','buyer2','both','agent','attorney','lender','inspector','other')),
  priority text not null default 'medium' check (priority in ('low','medium','high')),
  notes text not null default '',
  "relatedPropertyId" uuid references properties(id) on delete set null,
  "order" integer not null default 0
);
create index checklist_tasks_household_id_idx on "checklistTasks"("householdId");
create index checklist_tasks_checklist_id_idx on "checklistTasks"("checklistId");
create index checklist_tasks_status_idx on "checklistTasks"(status);
create index checklist_tasks_related_property_id_idx on "checklistTasks"("relatedPropertyId");

create table towns (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  name text not null,
  designation text not null default 'considering'
    check (designation in ('considering','primary','backup','ruled-out')),
  "whyConsidering" text not null default '',
  "typicalPriceNote" text not null default '',
  "taxNotes" text not null default '',
  "budgetFit" smallint check ("budgetFit" between 1 and 5),
  "stationName" text not null default '',
  "trainLine" text not null default '',
  "stationParking" text not null default '',
  "parkingPermitNotes" text not null default '',
  "doorToDoorCommuteMinutes" numeric,
  "commuteNotes" text not null default '',
  "stationNotes" text not null default '',
  "schoolDistrictNotes" text not null default '',
  "schoolRatingMetric" text not null default '',
  "schoolSource" text not null default '',
  "schoolVerificationMethod" text not null default '',
  "schoolVerifiedDate" text,
  "childcareNotes" text not null default '',
  "healthcareNotes" text not null default '',
  "floodNotes" text not null default '',
  "housingStockNotes" text not null default '',
  "typicalHomeAge" text not null default '',
  "lotSizeNotes" text not null default '',
  "renovationPatterns" text not null default '',
  "ordinanceNotes" text not null default '',
  visited boolean not null default false,
  "visitDate" text,
  "weekdayImpression" text not null default '',
  "weekendImpression" text not null default '',
  strengths text not null default '',
  weaknesses text not null default '',
  "generalNotes" text not null default '',
  confidence smallint check (confidence between 1 and 5)
);
create index towns_household_id_idx on towns("householdId");
create index towns_designation_idx on towns(designation);

-- ---------------------------------------------------------------------------
-- Journey (content-keyed, composite primary key)
-- ---------------------------------------------------------------------------

create table "journeyStages" (
  "householdId" uuid not null references households(id) on delete cascade,
  id text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "statusOverride" text check ("statusOverride" in (
    'not-started','learning','gathering','in-progress','blocked','ready','completed','revisit','not-applicable'
  )),
  "targetDate" text,
  owner text not null default 'both'
    check (owner in ('buyer1','buyer2','both','agent','attorney','lender','inspector','other')),
  notes text not null default '',
  "blockerNote" text not null default '',
  primary key ("householdId", id)
);

create table "journeyActions" (
  "householdId" uuid not null references households(id) on delete cascade,
  id text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "stageId" text not null,
  status text not null default 'not-started' check (status in (
    'not-started','learning','gathering','in-progress','blocked','ready','completed','revisit','not-applicable'
  )),
  owner text not null default 'both'
    check (owner in ('buyer1','buyer2','both','agent','attorney','lender','inspector','other')),
  "dueDate" text,
  notes text not null default '',
  "attachmentNote" text not null default '',
  "completedAt" text,
  primary key ("householdId", id)
);
create index journey_actions_stage_id_idx on "journeyActions"("householdId", "stageId");
create index journey_actions_status_idx on "journeyActions"("householdId", status);

create table "journeyDecisions" (
  "householdId" uuid not null references households(id) on delete cascade,
  id text not null,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "stageId" text not null,
  prompt text not null default '',
  answer text not null default '',
  "buyer1Approved" boolean not null default false,
  "buyer2Approved" boolean not null default false,
  "decidedAt" text,
  notes text not null default '',
  primary key ("householdId", id)
);
create index journey_decisions_stage_id_idx on "journeyDecisions"("householdId", "stageId");

create table "attendingTransition" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null unique references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "searchStatus" text not null default 'not-started'
    check ("searchStatus" in ('not-started','searching','interviewing','offer-received','contract-signed','started')),
  "expectedLocation" text not null default '',
  "expectedStartDate" text,
  "expectedBaseSalary" numeric,
  "salaryIsEstimate" boolean not null default true,
  "expectedShiftStructure" text not null default '',
  "expectedBonusStructure" text not null default '',
  "contractSigned" boolean not null default false,
  "contractSignedDate" text,
  "contractContingencies" text not null default '',
  "credentialingStatus" text not null default '',
  "lenderIncomeTreatment" text not null default 'not-yet-asked'
    check ("lenderIncomeTreatment" in ('unknown','not-yet-asked','asked-awaiting-answer','confirmed-in-writing','declined')),
  "lenderTreatmentNotes" text not null default '',
  "maxMonthsClosingToStart" numeric,
  "requiredReservesNote" text not null default '',
  "requiredDocumentationNote" text not null default '',
  notes text not null default ''
);

-- ---------------------------------------------------------------------------
-- Professionals, mortgage approvals
-- ---------------------------------------------------------------------------

create table professionals (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  name text not null,
  company text not null default '',
  role text not null default 'other' check (role in (
    'buyer-agent','attorney','lender','home-inspector','sewer-inspector','oil-tank-sweep',
    'radon-inspector','structural-engineer','insurance-agent','contractor','surveyor','title-company','other'
  )),
  phone text not null default '',
  email text not null default '',
  website text not null default '',
  "referralSource" text not null default 'unknown' check ("referralSource" in (
    'unknown','personal-referral','professional-referral','open-house','brokerage-directory',
    'realtor-directory','sold-listing-research','online-search','other'
  )),
  "referralSourceDetail" text not null default '',
  "townCoverage" text not null default '',
  "licenseInfo" text not null default '',
  "feeEstimate" numeric,
  "feeNote" text not null default '',
  "interviewDate" text,
  "interviewAnswers" jsonb not null default '{}'::jsonb,
  rating smallint check (rating between 1 and 5),
  "selectionStatus" text not null default 'candidate'
    check ("selectionStatus" in ('candidate','interviewed','selected','not-selected','no-longer-considering')),
  "selectedAt" text,
  "relatedPropertyIds" uuid[] not null default '{}',
  "documentNotes" text not null default '',
  concerns text not null default '',
  notes text not null default '',
  "agentVerification" jsonb not null default '{}'::jsonb,
  "agentScorecard" jsonb not null default '{}'::jsonb,
  "spouseDecisionNote" text not null default ''
);
create index professionals_household_id_idx on professionals("householdId");
create index professionals_role_idx on professionals(role);
create index professionals_selection_status_idx on professionals("selectionStatus");

create table "mortgageApprovals" (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  lender text not null,
  kind text not null default 'readiness-conversation'
    check (kind in ('readiness-conversation','prequalification','preapproval','fully-underwritten')),
  "professionalId" uuid references professionals(id) on delete set null,
  "issuedDate" text,
  "expiresDate" text,
  "maxLoanAmount" numeric,
  "maxPurchasePrice" numeric,
  "estimatedRatePct" numeric,
  "estimatedClosingCosts" numeric,
  "assumedAnnualTaxes" numeric,
  "assumedAnnualInsurance" numeric,
  "reserveRequirement" text not null default '',
  "creditReviewed" boolean not null default false,
  "incomeReviewed" boolean not null default false,
  "attendingContractReviewed" boolean not null default false,
  "assetsReviewed" boolean not null default false,
  "debtsReviewed" boolean not null default false,
  "downPaymentVerified" boolean not null default false,
  "propertyTypeRestrictions" text not null default '',
  "loanLimitNotes" text not null default '',
  notes text not null default ''
);
create index mortgage_approvals_household_id_idx on "mortgageApprovals"("householdId");
create index mortgage_approvals_lender_idx on "mortgageApprovals"(lender);
create index mortgage_approvals_kind_idx on "mortgageApprovals"(kind);

-- ---------------------------------------------------------------------------
-- Resources, documents, deals
-- ---------------------------------------------------------------------------

create table resources (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  title text not null,
  organization text not null default '',
  url text not null default '',
  topic text not null default '',
  "stageIds" text[] not null default '{}',
  description text not null default '',
  "whyUseful" text not null default '',
  "publisherKind" text not null default 'secondary' check ("publisherKind" in (
    'federal-government','nj-government','regulator','consumer-education','professional-organization','secondary'
  )),
  "dateAdded" text not null,
  "lastReviewedDate" text,
  status text not null default 'active' check (status in ('active','needs-review','outdated','archived')),
  notes text not null default '',
  "isFavorite" boolean not null default false,
  "isSeeded" boolean not null default false
);
create index resources_household_id_idx on resources("householdId");
create index resources_status_idx on resources(status);

create table documents (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  name text not null,
  category text not null default 'identification' check (category in (
    'identification','income','employment','attending-contract','taxes','bank-statements',
    'investment-statements','credit','preapproval','lender-quotes','buyer-agreement',
    'property-disclosures','offer','contract','attorney-review','inspection','appraisal',
    'insurance','loan-estimate','closing-disclosure','closing-documents'
  )),
  status text not null default 'needed' check (status in ('needed','requested','gathered','submitted','not-applicable')),
  "documentDate" text,
  "relatedStageId" text,
  "relatedPropertyId" uuid references properties(id) on delete set null,
  "storedLocation" text not null default '',
  notes text not null default ''
);
create index documents_household_id_idx on documents("householdId");
create index documents_category_idx on documents(category);
create index documents_related_property_id_idx on documents("relatedPropertyId");

create table deals (
  id uuid primary key default gen_random_uuid(),
  "householdId" uuid not null references households(id) on delete cascade,
  "createdAt" timestamptz not null default now(),
  "updatedAt" timestamptz not null default now(),
  "propertyId" uuid not null references properties(id) on delete cascade,
  "walkAwayPrice" numeric,
  "walkAwayRecordedAt" text,
  "walkAwayReasoning" text not null default '',
  readiness jsonb not null default '{}'::jsonb,
  offer jsonb not null default '{}'::jsonb,
  "negotiationLog" jsonb not null default '[]'::jsonb,
  "attorneyReview" jsonb not null default '{}'::jsonb,
  inspections jsonb not null default '[]'::jsonb,
  financing jsonb not null default '{}'::jsonb,
  "closingPrep" jsonb not null default '{}'::jsonb,
  "postClosing" jsonb not null default '{}'::jsonb
);
create index deals_household_id_idx on deals("householdId");
create index deals_property_id_idx on deals("propertyId");

-- ---------------------------------------------------------------------------
-- updatedAt trigger — applied to every table that has the column
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new."updatedAt" = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'households', '"buyerProfile"', '"financialProfile"', '"homePreferences"', '"appSettings"',
    'properties', '"propertyVisits"', '"mortgageScenarios"', '"lenderQuotes"', 'checklists',
    '"checklistTasks"', 'towns', '"journeyStages"', '"journeyActions"', '"journeyDecisions"',
    '"attendingTransition"', 'professionals', '"mortgageApprovals"', 'resources', 'documents', 'deals'
  ]
  loop
    execute format(
      'create trigger set_updated_at before update on %s for each row execute function public.set_updated_at();',
      t
    );
  end loop;
end $$;
