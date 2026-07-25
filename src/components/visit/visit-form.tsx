"use client";

import { useMemo } from "react";
import { useForm } from "react-hook-form";
import type { PropertyVisit } from "@/lib/models";
import { saveVisit, deleteVisit } from "@/lib/repo";
import { Button, Field, Input } from "@/components/ui";
import {
  RatingField,
  TextareaField,
  TriToggleField,
} from "@/components/form-fields";
import { useToast } from "@/components/toast";

const SHARED_RATINGS: { key: keyof PropertyVisit; label: string }[] = [
  { key: "firstImpression", label: "First impression" },
  { key: "neighborhoodFeeling", label: "Neighborhood feeling" },
  { key: "streetTraffic", label: "Street & traffic" },
  { key: "noise", label: "Noise" },
  { key: "naturalLight", label: "Natural light" },
  { key: "layout", label: "Layout" },
  { key: "kitchen", label: "Kitchen" },
  { key: "primaryBedroom", label: "Primary bedroom" },
  { key: "closetSpace", label: "Closet space" },
  { key: "bathrooms", label: "Bathrooms" },
  { key: "backyard", label: "Backyard" },
  { key: "basement", label: "Basement" },
  { key: "storage", label: "Storage" },
  { key: "wfhSuitability", label: "Work-from-home suitability" },
  { key: "childSafety", label: "Child safety" },
];

const CONCERNS: { key: keyof PropertyVisit; label: string }[] = [
  { key: "visibleWaterDamage", label: "Visible water damage" },
  { key: "mustySmells", label: "Musty smells" },
  { key: "foundationConcerns", label: "Foundation concerns" },
  { key: "roofConcerns", label: "Roof concerns" },
  { key: "hvacConcerns", label: "HVAC age or concerns" },
  { key: "electricalConcerns", label: "Electrical concerns" },
  { key: "plumbingConcerns", label: "Plumbing concerns" },
  { key: "windowCondition", label: "Window condition" },
];

export function VisitForm({
  visit,
  buyer1Name,
  buyer2Name,
  onSaved,
}: {
  visit: PropertyVisit;
  buyer1Name: string;
  buyer2Name: string;
  onSaved?: () => void;
}) {
  const { notify } = useToast();
  const defaults = useMemo(() => visit, [visit]);
  const { register, control, handleSubmit, formState } = useForm<PropertyVisit>({
    defaultValues: defaults,
  });

  const onSubmit = handleSubmit(async (values) => {
    await saveVisit({ ...defaults, ...values });
    notify("Visit notes saved");
    onSaved?.();
  });

  return (
    <form onSubmit={onSubmit} className="space-y-8 pb-24">
      <Field label="Visit date" className="max-w-xs">
        <Input type="date" {...register("visitDate")} />
      </Field>

      {/* Reflection question — prominent */}
      <div className="rounded-xl border border-accent/30 bg-accent-soft p-4 sm:p-5">
        <label className="block">
          <span className="font-display text-lg text-ink">
            Would we still want this house after the excitement wears off?
          </span>
          <textarea
            rows={3}
            className="hs-input mt-3"
            placeholder="Be honest with yourselves…"
            {...register("stillWantAfterExcitement")}
          />
        </label>
      </div>

      <Section title="First impressions & feel">
        <div className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
          {SHARED_RATINGS.map((r) => (
            <RatingField key={r.key} control={control} name={r.key} label={r.label} />
          ))}
        </div>
      </Section>

      <Section title="Condition & concerns" hint="Plain notes are enough — capture anything worth remembering.">
        <div className="grid gap-4 sm:grid-cols-2">
          {CONCERNS.map((c) => (
            <TextareaField
              key={c.key}
              register={register}
              name={c.key}
              label={c.label}
              rows={2}
            />
          ))}
        </div>
      </Section>

      <Section title="Repairs & questions">
        <div className="grid gap-4">
          <TextareaField register={register} name="immediateRepairs" label="Immediate repairs" />
          <TextareaField
            register={register}
            name="questionsForAgent"
            label="Questions for the listing agent"
          />
          <TextareaField
            register={register}
            name="wouldHaveToBeTrue"
            label="What would have to be true for us to buy this house?"
          />
        </div>
      </Section>

      <div className="grid gap-6 md:grid-cols-2">
        <SpouseBlock
          title={buyer1Name}
          register={register}
          control={control}
          prefix="buyer1Review"
        />
        <SpouseBlock
          title={buyer2Name}
          register={register}
          control={control}
          prefix="buyer2Review"
        />
      </div>

      {/* Sticky save bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-line bg-surface/95 px-4 py-3 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-content items-center justify-between gap-3">
          <button
            type="button"
            onClick={async () => {
              await deleteVisit(defaults.id);
              notify("Visit deleted");
              onSaved?.();
            }}
            className="text-sm text-ink-muted hover:text-critical"
          >
            Delete this visit
          </button>
          <Button type="submit" disabled={formState.isSubmitting}>
            {formState.isSubmitting ? "Saving…" : "Save visit notes"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function SpouseBlock({
  title,
  register,
  control,
  prefix,
}: {
  title: string;
  register: ReturnType<typeof useForm<PropertyVisit>>["register"];
  control: ReturnType<typeof useForm<PropertyVisit>>["control"];
  prefix: "buyer1Review" | "buyer2Review";
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h3 className="mb-3 font-display text-base text-ink">{title}</h3>
      <div className="space-y-4">
        <TextareaField register={register} name={`${prefix}.liked`} label="What I liked" rows={2} />
        <TextareaField
          register={register}
          name={`${prefix}.disliked`}
          label="What I disliked"
          rows={2}
        />
        <RatingField control={control} name={`${prefix}.emotionalExcitement`} label="Emotional excitement" />
        <RatingField control={control} name={`${prefix}.practicalFit`} label="Practical fit" />
        <TriToggleField control={control} name={`${prefix}.wouldVisitAgain`} label="Would visit again?" />
        <TriToggleField control={control} name={`${prefix}.wouldMakeOffer`} label="Would make an offer?" />
        <TextareaField register={register} name={`${prefix}.notes`} label="Other notes" rows={2} />
      </div>
    </div>
  );
}

function Section({
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
