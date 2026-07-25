"use client";

import { useForm } from "react-hook-form";
import type { HouseholdProfile } from "@/lib/models";
import { updateHousehold } from "@/lib/repo";
import { Button, Field, Input, Panel } from "@/components/ui";
import { NumberField, TextField, TextareaField, ToggleField } from "@/components/form-fields";
import { useToast } from "@/components/toast";

export function HouseholdSettings({ profile }: { profile: HouseholdProfile }) {
  const { notify } = useToast();
  const { register, control, handleSubmit, formState } = useForm<HouseholdProfile>({
    defaultValues: profile,
  });

  const onSubmit = handleSubmit(async (values) => {
    await updateHousehold({ ...profile, ...values });
    notify("Household profile saved");
  });

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Household</h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField register={register} name="buyer1Name" label="Buyer 1 name" />
          <TextField register={register} name="buyer2Name" label="Buyer 2 name" />
          <Field label="Planning date">
            <Input type="date" {...register("planningDate")} />
          </Field>
          <NumberField register={register} name="minOwnershipYears" label="Min ownership (years)" />
          <Field label="Ideal purchase start">
            <Input type="month" {...register("idealPurchaseStart")} />
          </Field>
          <Field label="Ideal purchase end">
            <Input type="month" {...register("idealPurchaseEnd")} />
          </Field>
          <NumberField register={register} name="combinedMonthlyTakeHome" label="Combined monthly take-home" />
          <div />
          <NumberField register={register} name="buyer1CreditScore" label="Buyer 1 credit score" />
          <NumberField register={register} name="buyer2CreditScore" label="Buyer 2 credit score" />
        </div>

        <IncomeBlock
          title="Buyer 1 income"
          prefix="buyer1Income"
          register={register}
          control={control}
        />
        <IncomeBlock
          title="Buyer 2 income (current)"
          prefix="buyer2Income"
          register={register}
          control={control}
        />
        <IncomeBlock
          title="Buyer 2 future income (assumption)"
          prefix="buyer2FutureIncome"
          register={register}
          control={control}
        />

        <TextareaField register={register} name="notes" label="Notes" rows={2} />

        <div className="flex justify-end">
          <Button type="submit" disabled={formState.isSubmitting}>
            Save household
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function IncomeBlock({
  title,
  prefix,
  register,
  control,
}: {
  title: string;
  prefix: "buyer1Income" | "buyer2Income" | "buyer2FutureIncome";
  register: ReturnType<typeof useForm<HouseholdProfile>>["register"];
  control: ReturnType<typeof useForm<HouseholdProfile>>["control"];
}) {
  return (
    <div className="rounded-lg border border-line p-4">
      <div className="mb-3 text-sm font-medium text-ink">{title}</div>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField register={register} name={`${prefix}.label`} label="Label" />
        <NumberField register={register} name={`${prefix}.annualBase`} label="Annual base" prefix="$" />
        <TextField register={register} name={`${prefix}.variableNote`} label="Variable / notes" className="sm:col-span-2" />
        <ToggleField control={control} name={`${prefix}.isAssumption`} label="This figure is an assumption" />
      </div>
    </div>
  );
}
