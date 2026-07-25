"use client";

import type { PlanResult } from "@/lib/calculations";
import { GUARDRAIL_LABELS } from "@/lib/calculations";
import { money, moneyPerMonth, percent } from "@/lib/format";
import { BandPill, Callout, GuardrailNote, Panel } from "@/components/ui";

const CLASSIFICATION: Record<string, string> = {
  comfortable: "Comfortable",
  "above-comfortable": "Stretch",
  "near-maximum": "Maximum",
  "beyond-limit": "Beyond walk-away limit",
  "missing-info": "Missing information",
};

export function PlanResultView({ plan }: { plan: PlanResult }) {
  return (
    <div className="space-y-5">
      <Panel className="p-5">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <div className="text-sm text-ink-muted">This scenario is</div>
            <div className="font-display text-xl text-ink">{CLASSIFICATION[plan.overallBand]}</div>
          </div>
          <BandPill band={plan.overallBand} label={GUARDRAIL_LABELS[plan.overallBand]} />
        </div>
        <div className="space-y-2">
          <GuardrailNote band={plan.priceBand} subject="purchase price" />
          <GuardrailNote band={plan.paymentBand} subject="payment" />
          {plan.reserveBand === "beyond-limit" && (
            <Callout tone="critical">
              Estimated post-closing cash falls below your minimum reserve.
            </Callout>
          )}
          {plan.reserveBand === "above-comfortable" && (
            <Callout tone="caution">
              Estimated post-closing cash meets the minimum but is below your preferred reserve.
            </Callout>
          )}
        </div>
      </Panel>

      <div className="grid gap-5 sm:grid-cols-2">
        <Panel className="p-5">
          <h3 className="mb-2 font-display text-base text-ink">Lender-style monthly payment</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Loan amount" value={money(plan.lender.loanAmount)} />
            <Row label="Principal & interest" value={moneyPerMonth(plan.lender.principalAndInterest)} />
            <Row label="Property taxes" value={moneyPerMonth(plan.lender.monthlyTaxes)} />
            <Row label="Homeowners insurance" value={moneyPerMonth(plan.lender.monthlyInsurance)} />
            <Row label="HOA" value={moneyPerMonth(plan.lender.monthlyHoa)} />
            <Row label="Mortgage insurance" value={moneyPerMonth(plan.lender.monthlyPmi)} />
            <Row label="Total (PITI + HOA)" value={moneyPerMonth(plan.lender.total)} strong />
          </dl>
        </Panel>

        <Panel className="p-5">
          <h3 className="mb-2 font-display text-base text-ink">Real monthly ownership cost</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Lender-style payment" value={moneyPerMonth(plan.lender.total)} />
            <Row label="Maintenance reserve" value={moneyPerMonth(plan.maintenanceMonthly)} />
            <Row label="Estimated real cost" value={moneyPerMonth(plan.realMonthlyOwnershipCost)} strong />
          </dl>
          <h3 className="mb-2 mt-4 font-display text-base text-ink">Income share (estimates)</h3>
          <dl className="space-y-1.5 text-sm">
            <Row label="Of gross income" value={percent(plan.housingPctOfGross)} />
            <Row label="Of take-home income" value={percent(plan.housingPctOfTakeHome)} />
            <Row label="Total debt-to-income" value={percent(plan.totalDti)} />
          </dl>
        </Panel>

        <Panel className="p-5 sm:col-span-2">
          <h3 className="mb-2 font-display text-base text-ink">Cash at closing</h3>
          <dl className="grid gap-x-8 gap-y-1.5 text-sm sm:grid-cols-2">
            <Row label="Cash required at closing" value={money(plan.cashRequiredAtClosing)} />
            <Row label="Cash remaining after closing" value={money(plan.cashRemainingAfterClosing)} strong />
            <Row label="Difference from minimum reserve" value={money(plan.differenceFromMinReserve)} />
            <Row label="Difference from preferred reserve" value={money(plan.differenceFromPreferredReserve)} />
          </dl>
        </Panel>
      </div>

      <p className="text-xs text-ink-subtle">
        Estimates only, using a standard fixed-rate amortization formula. Retirement funds are never
        counted as available closing cash. This is not financial advice.
      </p>
    </div>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div
      className={`flex items-center justify-between gap-4 ${
        strong ? "border-t border-line pt-1.5 font-semibold text-ink" : "text-ink"
      }`}
    >
      <dt className={strong ? "text-ink" : "text-ink-muted"}>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
