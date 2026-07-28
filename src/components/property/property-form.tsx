"use client";

import { useMemo } from "react";
import {
  Controller,
  useForm,
  type Control,
  type Path,
  type UseFormRegister,
} from "react-hook-form";
import { type Property, type PropertyFormValues } from "@/lib/models";
import { saveProperty } from "@/lib/repo";
import { emptyPropertyForm, prepareProperty, propertyToForm } from "@/lib/property-form";
import { Button, Field, Input, RatingInput, Select, Textarea } from "@/components/ui";
import {
  LISTING_STATUS_LABELS,
  PARKING_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_STATUS_ORDER,
  PROPERTY_TYPE_LABELS,
  TRAFFIC_LABELS,
} from "@/lib/labels";
import { useToast } from "@/components/toast";
import { useSaveStatus } from "@/lib/data/save-status";
import { SaveIndicator } from "@/components/save-indicator";

const RATING_FIELDS: { key: keyof Property["ratings"]; label: string }[] = [
  { key: "schoolConfidence", label: "School confidence" },
  { key: "commute", label: "Commute" },
  { key: "stationConvenience", label: "Station convenience" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "layout", label: "Layout" },
  { key: "condition", label: "Overall condition" },
  { key: "resaleConfidence", label: "Resale confidence" },
  { key: "backyard", label: "Backyard" },
  { key: "frontYard", label: "Front yard" },
  { key: "primaryBedroom", label: "Primary bedroom" },
  { key: "closet", label: "Primary closet" },
  { key: "kitchen", label: "Kitchen" },
  { key: "basement", label: "Basement" },
  { key: "garage", label: "Garage" },
  { key: "storage", label: "Storage" },
  { key: "naturalLight", label: "Natural light" },
  { key: "homeOffice", label: "Home-office potential" },
  { key: "childSafety", label: "Child safety" },
];

const numberOrNull = {
  setValueAs: (v: string): number | null => (v === "" || v === null ? null : Number(v)),
};

export function PropertyForm({
  property,
  onDone,
}: {
  property?: Property;
  onDone: () => void;
}) {
  const { notify } = useToast();
  const saveStatus = useSaveStatus();
  // Plain draft values — a blank draft renders immediately and never runs
  // persisted validation during render. Edit mode starts from the record's
  // real values; switching records re-derives defaults via the [property] dep.
  const defaults = useMemo<PropertyFormValues>(
    () => (property ? propertyToForm(property) : emptyPropertyForm()),
    [property],
  );

  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<PropertyFormValues>({ defaultValues: defaults });

  const onSubmit = handleSubmit(async (values) => {
    if (saveStatus.status === "saving") return; // guard against duplicate submits

    // Validate the complete property only at save time (safeParse — never throws).
    const prepared = prepareProperty(values, property);
    if (!prepared.ok) {
      if ("addressError" in prepared) {
        setError("address", { type: "validate", message: prepared.addressError });
      } else {
        notify(prepared.formError);
      }
      return;
    }

    const result = await saveStatus.run(() => saveProperty(prepared.property));
    if (result.ok) {
      notify("Property saved");
      onDone();
    }
    // On failure the form stays open with everything the user typed intact —
    // the SaveIndicator below shows the error and a Retry action.
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8 p-5 sm:p-6">
      <FormSection title="Identity">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Address" className="sm:col-span-2">
            <Input
              placeholder="123 Example Street"
              {...register("address", { required: "Enter a property address." })}
            />
            {errors.address && (
              <span className="mt-1 block text-xs text-critical">{errors.address.message}</span>
            )}
          </Field>
          <TextRow register={register} name="town" label="Town" />
          <TextRow register={register} name="zip" label="ZIP code" />
          <TextRow register={register} name="listingUrl" label="Listing URL" />
          <TextRow register={register} name="mlsNumber" label="MLS number" />
          <SelectRow
            register={register}
            name="listingStatus"
            label="Listing status"
            options={LISTING_STATUS_LABELS}
          />
          <Field label="Showing date">
            <Input type="date" {...register("showingDate")} />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Details">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumRow register={register} name="askingPrice" label="Asking price" />
          <NumRow register={register} name="offerPrice" label="Offer price" />
          <NumRow register={register} name="finalSalePrice" label="Final sale price" />
          <NumRow register={register} name="annualPropertyTaxes" label="Annual property taxes" />
          <NumRow register={register} name="hoaMonthly" label="HOA (monthly)" />
          <NumRow register={register} name="daysOnMarket" label="Days on market" />
          <NumRow register={register} name="bedrooms" label="Bedrooms" step="0.5" />
          <NumRow register={register} name="bathrooms" label="Bathrooms" step="0.5" />
          <NumRow register={register} name="squareFootage" label="Square footage" />
          <TextRow register={register} name="lotSize" label="Lot size" />
          <NumRow register={register} name="yearBuilt" label="Year built" />
          <SelectRow
            register={register}
            name="propertyType"
            label="Property type"
            options={PROPERTY_TYPE_LABELS}
          />
        </div>
      </FormSection>

      <FormSection title="Location & schools" hint="School data is research, not truth — record your source and verify independently.">
        <div className="grid gap-4 sm:grid-cols-2">
          <TextRow register={register} name="schools.elementary" label="Assigned elementary" />
          <TextRow register={register} name="schools.middle" label="Assigned middle" />
          <TextRow register={register} name="schools.high" label="Assigned high" />
          <TextRow register={register} name="schools.ratingMetric" label="Rating / metric" />
          <TextRow register={register} name="schools.source" label="Source" />
          <Field label="Date verified">
            <Input type="date" {...register("schools.verifiedDate")} />
          </Field>
          <Field label="School notes" className="sm:col-span-2">
            <Textarea {...register("schools.notes")} />
          </Field>
          <TextRow register={register} name="stationName" label="Station name" />
          <TextRow register={register} name="distanceToStation" label="Distance to station" />
          <SelectRow
            register={register}
            name="parking"
            label="Parking availability"
            options={PARKING_LABELS}
          />
          <SelectRow
            register={register}
            name="trafficLevel"
            label="Traffic level"
            options={TRAFFIC_LABELS}
          />
          <NumRow register={register} name="driveToStationMinutes" label="Drive to station (min)" />
          <NumRow
            register={register}
            name="doorToDoorCommuteMinutes"
            label="Door-to-door commute (min)"
          />
          <Field label="Neighborhood notes" className="sm:col-span-2">
            <Textarea {...register("neighborhoodNotes")} />
          </Field>
          <TextRow register={register} name="roadNoise" label="Road noise" />
          <Field label="Flood-zone notes">
            <Input {...register("floodZoneNotes")} placeholder="e.g. Checked FEMA — Zone X" />
          </Field>
        </div>
      </FormSection>

      <FormSection title="Features & condition" hint="Rate 1–5. Leave blank until you have seen it.">
        <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          {RATING_FIELDS.map((f) => (
            <RatingRow key={f.key} control={control} name={`ratings.${f.key}`} label={f.label} />
          ))}
        </div>
      </FormSection>

      <FormSection title="Financial inputs" hint="Blank fields fall back to your planning defaults from Settings.">
        <div className="grid gap-4 sm:grid-cols-3">
          <NumRow register={register} name="finance.expectedDownPayment" label="Expected down payment" />
          <NumRow register={register} name="finance.mortgageRatePct" label="Mortgage rate (%)" step="0.01" />
          <NumRow register={register} name="finance.loanTermYears" label="Loan term (years)" />
          <NumRow
            register={register}
            name="finance.insuranceEstimateAnnual"
            label="Insurance (annual)"
          />
          <NumRow register={register} name="finance.maintenancePct" label="Maintenance (%/yr)" step="0.1" />
          <NumRow
            register={register}
            name="finance.closingCostAssumption"
            label="Closing-cost assumption"
          />
          <NumRow
            register={register}
            name="finance.immediateRenovationEstimate"
            label="Immediate renovation estimate"
          />
        </div>
      </FormSection>

      <FormSection title="Workflow & notes">
        <div className="grid gap-4 sm:grid-cols-2">
          <SelectRow
            register={register}
            name="status"
            label="Workflow status"
            options={Object.fromEntries(
              PROPERTY_STATUS_ORDER.map((s) => [s, PROPERTY_STATUS_LABELS[s]]),
            )}
          />
          <div />
          <Field label="Notes" className="sm:col-span-2">
            <Textarea rows={4} {...register("notes")} />
          </Field>
        </div>
      </FormSection>

      <div className="sticky bottom-0 -mx-5 flex items-center justify-end gap-3 border-t border-line bg-surface px-5 py-3 sm:-mx-6 sm:px-6">
        <SaveIndicator status={saveStatus.status} error={saveStatus.error} onRetry={saveStatus.retry} />
        <Button type="button" variant="secondary" onClick={onDone}>
          Cancel
        </Button>
        <Button type="submit" disabled={saveStatus.status === "saving"}>
          {saveStatus.status === "saving" ? "Saving…" : "Save property"}
        </Button>
      </div>
    </form>
  );
}

// ---- Section + bound field helpers ---------------------------------------

function FormSection({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-3 border-b border-line pb-2">
        <h3 className="font-display text-base text-ink">{title}</h3>
        {hint && <p className="mt-0.5 text-xs text-ink-subtle">{hint}</p>}
      </div>
      {children}
    </section>
  );
}

function TextRow({
  register,
  name,
  label,
}: {
  register: UseFormRegister<PropertyFormValues>;
  name: Path<PropertyFormValues>;
  label: string;
}) {
  return (
    <Field label={label}>
      <Input {...register(name)} />
    </Field>
  );
}

function NumRow({
  register,
  name,
  label,
  step,
}: {
  register: UseFormRegister<PropertyFormValues>;
  name: Path<PropertyFormValues>;
  label: string;
  step?: string;
}) {
  return (
    <Field label={label}>
      <Input type="number" step={step} inputMode="decimal" {...register(name, numberOrNull)} />
    </Field>
  );
}

function SelectRow({
  register,
  name,
  label,
  options,
}: {
  register: UseFormRegister<PropertyFormValues>;
  name: Path<PropertyFormValues>;
  label: string;
  options: Record<string, string>;
}) {
  return (
    <Field label={label}>
      <Select {...register(name)}>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </Select>
    </Field>
  );
}

function RatingRow({
  control,
  name,
  label,
}: {
  control: Control<PropertyFormValues>;
  name: Path<PropertyFormValues>;
  label: string;
}) {
  return (
    <div className="flex flex-col items-start gap-2">
      <span className="text-sm text-ink">{label}</span>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <RatingInput
            ariaLabel={label}
            value={(field.value as number | null) ?? null}
            onChange={field.onChange}
          />
        )}
      />
    </div>
  );
}
