import type {
  AppSettings,
  FinancialProfile,
  HomePreferences,
  HouseholdProfile,
} from "@/lib/models";
import { SCHEMA_VERSION, SINGLETON_ID } from "@/lib/models";

/**
 * The household's real, editable planning profile. These are the values from
 * the initial plan; every one of them can be changed in Settings. Forward-looking
 * figures (e.g. the attending salary) are seeded as clearly-labeled assumptions.
 */
export function seedHouseholdProfile(ts: string): HouseholdProfile {
  return {
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,
    planningDate: "2026-07-23",
    idealPurchaseStart: "2027-05",
    idealPurchaseEnd: "2027-06",
    minOwnershipYears: 10,
    buyer1Name: "Me",
    buyer2Name: "Wife",
    buyer1Income: {
      label: "Buyer 1 base salary",
      annualBase: 152_000,
      variableNote: "Plus a variable bonus (not modeled numerically).",
      isAssumption: false,
    },
    buyer2Income: {
      label: "Buyer 2 salary (resident)",
      annualBase: 80_000,
      variableNote: "",
      isAssumption: false,
    },
    buyer2FutureIncome: {
      label: "Buyer 2 future salary (attending physician)",
      annualBase: null,
      variableNote: "Expected around June–July 2027. Amount currently unknown.",
      isAssumption: true,
    },
    combinedMonthlyTakeHome: 12_000,
    buyer1CreditScore: 800,
    buyer2CreditScore: 700,
    notes: "",
  };
}

export function seedFinancialProfile(ts: string): FinancialProfile {
  return {
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,

    checking: 15_000,
    savings: 40_000,
    taxableInvestments: 250_000,
    retirementAccounts: 170_000,
    designatedDownPaymentCash: 36_000,

    minReserve: 40_000,
    preferredReserve: 60_000,
    retirementAvailableForPurchase: 0,

    vehicleBalanceRemaining: 30_000,
    carPaymentsAndInsuranceMonthly: 2_000,
    otherTransportMonthly: 500,
    studentLoansMonthly: 0,
    otherDebtMonthly: 0,

    groceriesMonthly: 750,
    diningShoppingMonthly: 500,
    insuranceMonthly: 400,
    retirementContributionMonthly: 400,
    espcontributionMonthly: 1_000,
    childcareMonthly: null, // unknown — editable planning assumption
    travelMonthly: 0,

    priceComfortableMin: 1_000_000,
    priceComfortableMax: 1_150_000,
    priceRoutineCeiling: 1_200_000,
    priceAbsoluteCeiling: 1_300_000,

    paymentComfortable: 8_000,
    paymentMaxTarget: 9_000,
    paymentAbsoluteCeiling: 10_000,

    planningInterestRatePct: 6.5,
    defaultLoanTermYears: 30,
    defaultMaintenancePct: 1,
  };
}

export function seedHomePreferences(ts: string): HomePreferences {
  return {
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,
    primaryTowns: ["Princeton", "Summit", "Ridgewood", "Livingston", "Short Hills"],
    backupTowns: [],
    minSchoolRating: 8,
    minBedrooms: 3,
    minBathrooms: 3,
    requiredNotes: [
      "At least 3 bedrooms and 3 bathrooms.",
      "Strong New Jersey school district.",
      "Decent backyard, small front yard.",
      "Train access nearby or practical station parking.",
      "Commute roughly 90 minutes or less to NYC / Jersey City.",
    ].join("\n"),
    preferredNotes: ["Large primary bedroom.", "Large primary closet."].join("\n"),
    dealbreakerNotes: [
      "Weak school district.",
      "Assigned schools below our acceptable threshold.",
      "A commute that is impractical in reality.",
    ].join("\n"),
    maxCommuteMinutes: 90,
    renovationTolerance: "moderate",
    renovationDecided: false,
  };
}

export function seedAppSettings(ts: string): AppSettings {
  return {
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,
    schemaVersion: SCHEMA_VERSION,
    theme: "system",
    seeded: true,
    lastBackupAt: null,
  };
}
