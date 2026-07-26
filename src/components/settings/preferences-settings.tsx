"use client";

import { Controller, useForm, type Control, type Path } from "react-hook-form";
import type { HomePreferences } from "@/lib/models";
import { updatePreferences } from "@/lib/repo";
import { Button, Field, Panel, Textarea } from "@/components/ui";
import { NumberField, SelectField, TextareaField, ToggleField } from "@/components/form-fields";
import { RENOVATION_LABELS } from "@/lib/labels";
import { useToast } from "@/components/toast";
import { useSaveStatus } from "@/lib/data/save-status";
import { SaveIndicator } from "@/components/save-indicator";

export function PreferencesSettings({ preferences }: { preferences: HomePreferences }) {
  const { notify } = useToast();
  const saveStatus = useSaveStatus();
  const { register, control, handleSubmit } = useForm<HomePreferences>({
    defaultValues: preferences,
  });

  const onSubmit = handleSubmit(async (values) => {
    const result = await saveStatus.run(() => updatePreferences({ ...preferences, ...values }));
    if (result.ok) notify("Preferences saved");
  });

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-4 font-display text-lg text-ink">Home preferences</h2>
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 sm:grid-cols-2">
          <TownsField control={control} name="primaryTowns" label="Primary towns (one per line)" />
          <TownsField control={control} name="backupTowns" label="Backup towns (one per line)" />
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <NumberField register={register} name="minSchoolRating" label="Min school rating (research)" />
          <NumberField register={register} name="minBedrooms" label="Min bedrooms" />
          <NumberField register={register} name="minBathrooms" label="Min bathrooms" />
          <NumberField register={register} name="maxCommuteMinutes" label="Max commute (min)" />
          <SelectField
            register={register}
            name="renovationTolerance"
            label="Renovation tolerance"
            options={RENOVATION_LABELS}
          />
          <div className="flex items-end pb-2">
            <ToggleField control={control} name="renovationDecided" label="Renovation tolerance decided" />
          </div>
        </div>
        <div className="grid gap-4">
          <TextareaField register={register} name="requiredNotes" label="Required" rows={3} />
          <TextareaField register={register} name="preferredNotes" label="Preferred" rows={2} />
          <TextareaField register={register} name="dealbreakerNotes" label="Deal-breakers" rows={2} />
        </div>
        <div className="flex items-center justify-end gap-3">
          <SaveIndicator status={saveStatus.status} error={saveStatus.error} onRetry={saveStatus.retry} />
          <Button type="submit" disabled={saveStatus.status === "saving"}>
            Save preferences
          </Button>
        </div>
      </form>
    </Panel>
  );
}

function TownsField({
  control,
  name,
  label,
}: {
  control: Control<HomePreferences>;
  name: Path<HomePreferences>;
  label: string;
}) {
  return (
    <Field label={label}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => {
          const arr = (field.value as string[]) ?? [];
          return (
            <Textarea
              rows={5}
              value={arr.join("\n")}
              onChange={(e) =>
                field.onChange(
                  e.target.value
                    .split("\n")
                    .map((s) => s.trim())
                    .filter(Boolean),
                )
              }
            />
          );
        }}
      />
    </Field>
  );
}
