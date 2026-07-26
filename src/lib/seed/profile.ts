import type {
  AppSettings,
  FinancialProfile,
  HomePreferences,
  HouseholdProfile,
} from "@/lib/models";
import { SCHEMA_VERSION, SINGLETON_ID } from "@/lib/models";

/**
 * A neutral starting planning profile. Every one of these values is a
 * placeholder meant to be filled in from Settings — none of it is real
 * financial information. (This file previously seeded real household
 * figures; that was fine for a strictly local, single-device app, but this
 * app is now backed by a shared cloud database, so nothing personal may ship
 * in source code. See the privacy section of the deployment plan.)
 */
export function seedHouseholdProfile(ts: string): HouseholdProfile {
  return {
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,
    planningDate: ts.slice(0, 10),
    idealPurchaseStart: "",
    idealPurchaseEnd: "",
    minOwnershipYears: 10,
    buyer1Name: "Me",
    buyer2Name: "Partner",
    buyer1Income: {
      label: "Buyer 1 income",
      annualBase: null,
      variableNote: "",
      isAssumption: false,
    },
    buyer2Income: {
      label: "Buyer 2 income",
      annualBase: null,
      variableNote: "",
      isAssumption: false,
    },
    buyer2FutureIncome: {
      label: "Future income (if applicable)",
      annualBase: null,
      variableNote: "",
      isAssumption: true,
    },
    combinedMonthlyTakeHome: null,
    buyer1CreditScore: null,
    buyer2CreditScore: null,
    notes: "",
  };
}

export function seedFinancialProfile(ts: string): FinancialProfile {
  return {
    id: SINGLETON_ID,
    createdAt: ts,
    updatedAt: ts,

    checking: null,
    savings: null,
    taxableInvestments: null,
    retirementAccounts: null,
    designatedDownPaymentCash: null,

    minReserve: null,
    preferredReserve: null,
    retirementAvailableForPurchase: 0,

    vehicleBalanceRemaining: null,
    carPaymentsAndInsuranceMonthly: null,
    otherTransportMonthly: null,
    studentLoansMonthly: null,
    otherDebtMonthly: null,

    groceriesMonthly: null,
    diningShoppingMonthly: null,
    insuranceMonthly: null,
    retirementContributionMonthly: null,
    espcontributionMonthly: null,
    childcareMonthly: null, // unknown — editable planning assumption
    travelMonthly: null,

    priceComfortableMin: null,
    priceComfortableMax: null,
    priceRoutineCeiling: null,
    priceAbsoluteCeiling: null,

    paymentComfortable: null,
    paymentMaxTarget: null,
    paymentAbsoluteCeiling: null,

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
    primaryTowns: [],
    backupTowns: [],
    minSchoolRating: 0,
    minBedrooms: 0,
    minBathrooms: 0,
    requiredNotes: "",
    preferredNotes: "",
    dealbreakerNotes: "",
    maxCommuteMinutes: 0,
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
    seeded: true,
    lastBackupAt: null,
  };
}
