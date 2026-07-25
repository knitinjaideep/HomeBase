import type { FinancialProfile, HouseholdProfile, MortgageScenario } from "./models";
import { estimatedClosingCosts, type PlanInputs } from "./calculations";
import {
  availablePurchaseFunds,
  grossMonthlyIncome,
  monthlyDebts,
  paymentGuardrails,
  priceGuardrails,
  estimatedAnnualInsurance,
} from "./property-finance";

/** Editable scenario values (everything except the stored base fields). */
export type ScenarioValues = Omit<MortgageScenario, "id" | "createdAt" | "updatedAt">;

/** A sensible starting scenario derived from the household's profile. */
export function baseScenarioValues(
  financial: FinancialProfile,
  household: HouseholdProfile,
  name = "New scenario",
): ScenarioValues {
  const price = financial.priceComfortableMax ?? 1_000_000;
  const taxes = price * 0.02; // NJ property taxes are roughly 2% of value
  const insurance = estimatedAnnualInsurance(price);
  return {
    name,
    propertyId: null,
    purchasePrice: price,
    downPaymentMode: "percent",
    downPaymentValue: 20,
    mortgageRatePct: financial.planningInterestRatePct,
    loanTermYears: financial.defaultLoanTermYears,
    annualPropertyTaxes: Math.round(taxes),
    annualInsurance: Math.round(insurance),
    monthlyHoa: 0,
    includePmi: true,
    pmiRatePct: 0.6,
    closingCosts: Math.round(estimatedClosingCosts(price)),
    prepaidEscrow: Math.round(taxes * 0.25 + insurance * 0.25),
    immediateRenovation: 0,
    movingBudget: 5_000,
    maintenancePct: financial.defaultMaintenancePct,
    utilitiesMonthly: 0,
    commutingDeltaMonthly: 0,
    renovationAllocationMonthly: 0,
    availableFunds: availablePurchaseFunds(financial),
    minReserve: financial.minReserve ?? 0,
    preferredReserve: financial.preferredReserve ?? 0,
    grossMonthlyIncome: Math.round(grossMonthlyIncome(household)),
    takeHomeMonthlyIncome: household.combinedMonthlyTakeHome ?? 0,
    monthlyDebts: monthlyDebts(financial),
    childcareMonthly: financial.childcareMonthly ?? 0,
    assumptionNote: "",
  };
}

/** Convenience starting points. All are fully editable after loading. */
export const PRESETS: {
  key: string;
  label: string;
  build: (f: FinancialProfile, h: HouseholdProfile) => ScenarioValues;
}[] = [
  {
    key: "comfortable",
    label: "Comfortable",
    build: (f, h) => baseScenarioValues(f, h, "Comfortable"),
  },
  {
    key: "stretch",
    label: "Stretch",
    build: (f, h) => ({
      ...baseScenarioValues(f, h, "Stretch"),
      purchasePrice: f.priceRoutineCeiling ?? f.priceComfortableMax ?? 1_200_000,
    }),
  },
  {
    key: "walk-away",
    label: "Walk away",
    build: (f, h) => ({
      ...baseScenarioValues(f, h, "Walk away"),
      purchasePrice: f.priceAbsoluteCeiling ?? 1_300_000,
    }),
  },
  {
    key: "physician",
    label: "Physician loan",
    build: (f, h) => ({
      ...baseScenarioValues(f, h, "Physician loan"),
      downPaymentValue: 5,
      includePmi: false,
      assumptionNote: "Physician loan: low down payment, typically no PMI. Verify terms with lender.",
    }),
  },
  {
    key: "conventional",
    label: "Conventional",
    build: (f, h) => ({
      ...baseScenarioValues(f, h, "Conventional"),
      assumptionNote: "Conventional loan with 20% down.",
    }),
  },
  {
    key: "jumbo",
    label: "Jumbo",
    build: (f, h) => ({
      ...baseScenarioValues(f, h, "Jumbo"),
      purchasePrice: Math.max(f.priceRoutineCeiling ?? 0, 1_250_000),
      assumptionNote: "Jumbo loan above the conforming limit. Reserves and rate may differ.",
    }),
  },
];

/** Turn scenario values into the tested calculation core's inputs. */
export function scenarioToPlanInputs(v: ScenarioValues, financial: FinancialProfile): PlanInputs {
  const downPayment =
    v.downPaymentMode === "percent" ? (v.purchasePrice * v.downPaymentValue) / 100 : v.downPaymentValue;
  return {
    purchasePrice: v.purchasePrice,
    downPayment,
    annualRatePct: v.mortgageRatePct,
    termYears: v.loanTermYears,
    annualPropertyTaxes: v.annualPropertyTaxes,
    annualInsurance: v.annualInsurance,
    monthlyHoa: v.monthlyHoa,
    includePmi: v.includePmi,
    annualPmiRatePct: v.pmiRatePct,
    closingCosts: v.closingCosts,
    prepaidEscrow: v.prepaidEscrow,
    immediateRenovation: v.immediateRenovation,
    movingBudget: v.movingBudget,
    maintenancePct: v.maintenancePct,
    utilitiesMonthly: v.utilitiesMonthly,
    commutingDeltaMonthly: v.commutingDeltaMonthly,
    renovationAllocationMonthly: v.renovationAllocationMonthly,
    availableFunds: v.availableFunds,
    minReserve: v.minReserve,
    preferredReserve: v.preferredReserve,
    grossMonthlyIncome: v.grossMonthlyIncome,
    takeHomeMonthlyIncome: v.takeHomeMonthlyIncome,
    monthlyDebts: v.monthlyDebts,
    priceGuardrails: priceGuardrails(financial),
    paymentGuardrails: paymentGuardrails(financial),
  };
}
