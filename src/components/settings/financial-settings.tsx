"use client";

import { useForm } from "react-hook-form";
import type { FinancialProfile } from "@/lib/models";
import { updateFinancial } from "@/lib/repo";
import { Button, Callout, Panel } from "@/components/ui";
import { NumberField } from "@/components/form-fields";
import { useToast } from "@/components/toast";

export function FinancialSettings({ profile }: { profile: FinancialProfile }) {
  const { notify } = useToast();
  const { register, handleSubmit, formState } = useForm<FinancialProfile>({
    defaultValues: profile,
  });

  const onSubmit = handleSubmit(async (values) => {
    await updateFinancial({ ...profile, ...values });
    notify("Financial profile saved");
  });

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Finances & guardrails</h2>
      <form onSubmit={onSubmit} className="space-y-6">
        <Group title="Assets">
          <NumberField register={register} name="checking" label="Checking" prefix="$" />
          <NumberField register={register} name="savings" label="Savings" prefix="$" />
          <NumberField register={register} name="taxableInvestments" label="Taxable investments" prefix="$" />
          <NumberField register={register} name="retirementAccounts" label="Retirement accounts" prefix="$" />
          <NumberField register={register} name="designatedDownPaymentCash" label="Designated down-payment cash" prefix="$" />
        </Group>

        <Group title="Reserves">
          <NumberField register={register} name="minReserve" label="Minimum reserve" prefix="$" />
          <NumberField register={register} name="preferredReserve" label="Preferred reserve" prefix="$" />
          <NumberField
            register={register}
            name="retirementAvailableForPurchase"
            label="Retirement available for purchase"
            prefix="$"
            hint="Kept at $0 by default — retirement is not counted as closing cash."
          />
        </Group>

        <Group title="Debts & recurring">
          <NumberField register={register} name="vehicleBalanceRemaining" label="Vehicle balance remaining" prefix="$" />
          <NumberField register={register} name="carPaymentsAndInsuranceMonthly" label="Car payments + insurance / mo" prefix="$" />
          <NumberField register={register} name="otherTransportMonthly" label="Other transport / mo" prefix="$" />
          <NumberField register={register} name="studentLoansMonthly" label="Student loans / mo" prefix="$" />
          <NumberField register={register} name="otherDebtMonthly" label="Other debt / mo" prefix="$" />
        </Group>

        <Group title="Monthly expenses (assumptions)">
          <NumberField register={register} name="groceriesMonthly" label="Groceries" prefix="$" />
          <NumberField register={register} name="diningShoppingMonthly" label="Dining & shopping" prefix="$" />
          <NumberField register={register} name="insuranceMonthly" label="Insurance" prefix="$" />
          <NumberField register={register} name="retirementContributionMonthly" label="Retirement contributions" prefix="$" />
          <NumberField register={register} name="espcontributionMonthly" label="Employee stock purchase" prefix="$" />
          <NumberField register={register} name="childcareMonthly" label="Childcare" prefix="$" hint="Unknown by default — leave blank until decided." />
          <NumberField register={register} name="travelMonthly" label="Travel" prefix="$" />
        </Group>

        <Group title="Purchase-price guardrails">
          <NumberField register={register} name="priceComfortableMin" label="Comfortable minimum" prefix="$" />
          <NumberField register={register} name="priceComfortableMax" label="Comfortable maximum" prefix="$" />
          <NumberField register={register} name="priceRoutineCeiling" label="Routine offer ceiling" prefix="$" />
          <NumberField register={register} name="priceAbsoluteCeiling" label="Absolute walk-away ceiling" prefix="$" />
        </Group>

        <Group title="Monthly-payment guardrails">
          <NumberField register={register} name="paymentComfortable" label="Comfortable payment" prefix="$" />
          <NumberField register={register} name="paymentMaxTarget" label="Maximum target payment" prefix="$" />
          <NumberField register={register} name="paymentAbsoluteCeiling" label="Absolute payment ceiling" prefix="$" />
        </Group>

        <Group title="Planning defaults">
          <NumberField register={register} name="planningInterestRatePct" label="Planning interest rate (%)" step="0.01" />
          <NumberField register={register} name="defaultLoanTermYears" label="Default loan term (years)" />
          <NumberField register={register} name="defaultMaintenancePct" label="Default maintenance (%/yr)" step="0.1" />
        </Group>

        <Callout tone="neutral">
          These guardrails drive the calm warnings shown on properties and scenarios. Adjust them as
          your plan changes — nothing is locked.
        </Callout>

        <div className="flex justify-end">
          <Button type="submit" disabled={formState.isSubmitting}>
            Save finances
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">{title}</div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{children}</div>
    </div>
  );
}
