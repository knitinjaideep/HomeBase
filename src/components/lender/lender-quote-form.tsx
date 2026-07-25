"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import { lenderQuoteSchema, type LenderQuote } from "@/lib/models";
import { saveLenderQuote, deleteLenderQuote } from "@/lib/repo";
import { newId, now } from "@/lib/util";
import { Button, Field, Input } from "@/components/ui";
import {
  NumberField,
  SelectField,
  TextField,
  TextareaField,
  TriToggleField,
} from "@/components/form-fields";
import { LOAN_TYPE_LABELS } from "@/lib/labels";
import { useToast } from "@/components/toast";

export function emptyLenderQuote(): LenderQuote {
  const ts = now();
  const base = lenderQuoteSchema.parse({
    id: newId(),
    createdAt: ts,
    updatedAt: ts,
    lender: "placeholder",
  });
  return { ...base, lender: "" };
}

export function LenderQuoteForm({
  quote,
  onDone,
}: {
  quote?: LenderQuote;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const defaults = useMemo<LenderQuote>(() => quote ?? emptyLenderQuote(), [quote]);
  const { register, control, handleSubmit, formState } = useForm<LenderQuote>({
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit(async (values) => {
    await saveLenderQuote({ ...defaults, ...values });
    notify("Quote saved");
    onDone();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8 p-5 sm:p-6">
      <Section title="Lender">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Lender">
            <Input {...register("lender", { required: "Lender is required" })} />
            {formState.errors.lender && (
              <span className="mt-1 block text-xs text-critical">
                {formState.errors.lender.message}
              </span>
            )}
          </Field>
          <TextField register={register} name="contact" label="Contact" />
          <SelectField register={register} name="loanType" label="Loan type" options={LOAN_TYPE_LABELS} />
          <Field label="Quote date">
            <Input type="date" {...register("quoteDate")} />
          </Field>
        </div>
      </Section>

      <Section title="Loan terms">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField register={register} name="purchasePrice" label="Purchase price" prefix="$" />
          <NumberField register={register} name="loanAmount" label="Loan amount" prefix="$" />
          <NumberField register={register} name="downPayment" label="Down payment" prefix="$" />
          <NumberField register={register} name="interestRatePct" label="Interest rate (%)" step="0.01" />
          <NumberField register={register} name="aprPct" label="APR (%)" step="0.01" />
          <SelectField
            register={register}
            name="rateType"
            label="Rate type"
            options={{ fixed: "Fixed", adjustable: "Adjustable" }}
          />
          <NumberField register={register} name="loanTermYears" label="Loan term (years)" />
          <NumberField register={register} name="points" label="Points (%)" step="0.125" />
          <NumberField register={register} name="lenderFees" label="Lender fees" prefix="$" />
          <NumberField
            register={register}
            name="estimatedClosingCosts"
            label="Estimated closing costs"
            prefix="$"
          />
          <NumberField register={register} name="rateLockDays" label="Rate-lock (days)" />
        </div>
      </Section>

      <Section title="Program details">
        <div className="grid gap-4 sm:grid-cols-2">
          <TriToggleField control={control} name="hasPmi" label="PMI required?" />
          <TriToggleField control={control} name="contractIncomeEligible" label="Contract-income eligible?" />
          <TriToggleField control={control} name="prepaymentPenalty" label="Prepayment penalty?" />
          <NumberField
            register={register}
            name="maxMonthsBeforeStart"
            label="Max months before employment start"
          />
          <TextField register={register} name="reserveRequirement" label="Reserve requirement" />
        </div>
      </Section>

      <Section title="Notes">
        <TextareaField register={register} name="notes" label="Notes" rows={3} />
      </Section>

      <div className="sticky bottom-0 -mx-5 flex items-center justify-between gap-3 border-t border-line bg-surface px-5 py-3 sm:-mx-6 sm:px-6">
        {quote ? (
          <button
            type="button"
            onClick={async () => {
              await deleteLenderQuote(defaults.id);
              notify("Quote deleted");
              onDone();
            }}
            className="text-sm text-ink-muted hover:text-critical"
          >
            Delete
          </button>
        ) : (
          <span />
        )}
        <div className="flex gap-3">
          <Button type="button" variant="secondary" onClick={onDone}>
            Cancel
          </Button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Saving…" : "Save quote"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3 border-b border-line pb-2">
        <h3 className="font-display text-base text-ink">{title}</h3>
      </div>
      {children}
    </section>
  );
}
