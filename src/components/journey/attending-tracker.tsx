"use client";

import type { AttendingTransition, HouseholdProfile } from "@/lib/models";
import { updateAttendingTransition } from "@/lib/repo";
import { Field, Input, Select, Textarea, Toggle, Callout } from "@/components/ui";

const SEARCH_STATUS: { value: AttendingTransition["searchStatus"]; label: string }[] = [
  { value: "not-started", label: "Not started" },
  { value: "searching", label: "Searching" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer-received", label: "Offer received" },
  { value: "contract-signed", label: "Contract signed" },
  { value: "started", label: "Already started" },
];

const TREATMENT: { value: AttendingTransition["lenderIncomeTreatment"]; label: string }[] = [
  { value: "unknown", label: "Unknown" },
  { value: "not-yet-asked", label: "Not yet asked" },
  { value: "asked-awaiting-answer", label: "Asked — awaiting answer" },
  { value: "confirmed-in-writing", label: "Confirmed in writing" },
  { value: "declined", label: "Lender declined to use it" },
];

/**
 * The Stage 3 tracker for the resident → attending transition. A single record
 * (there is one transition), edited in place. Nothing here is advice; it records
 * what we know and flags what a lender must confirm.
 */
export function AttendingTracker({
  transition,
  household,
}: {
  transition: AttendingTransition | undefined;
  household: HouseholdProfile;
}) {
  const t = transition;
  const set = (patch: Partial<AttendingTransition>) => void updateAttendingTransition(patch);
  const notConfirmed = (t?.lenderIncomeTreatment ?? "not-yet-asked") !== "confirmed-in-writing";

  return (
    <div className="space-y-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <p className="text-sm text-ink-muted">
        Tracking {household.buyer2Name}&rsquo;s transition to attending physician. These figures drive how a
        lender can consider the future income — record them as they firm up.
      </p>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Job-search status">
          <Select
            value={t?.searchStatus ?? "not-started"}
            onChange={(e) => set({ searchStatus: e.target.value as AttendingTransition["searchStatus"] })}
          >
            {SEARCH_STATUS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Expected job location">
          <Input
            defaultValue={t?.expectedLocation ?? ""}
            placeholder="Town / hospital / region"
            onBlur={(e) => set({ expectedLocation: e.target.value })}
          />
        </Field>
        <Field label="Expected start date">
          <Input
            type="date"
            value={t?.expectedStartDate ?? ""}
            onChange={(e) => set({ expectedStartDate: e.target.value || null })}
          />
        </Field>
        <Field label="Expected base salary" hint="A range is fine — mark it an estimate below.">
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={t?.expectedBaseSalary ?? ""}
            placeholder="e.g. 350000"
            onBlur={(e) => set({ expectedBaseSalary: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
      </div>

      <div className="flex flex-wrap gap-6">
        <Toggle
          checked={t?.salaryIsEstimate ?? true}
          onChange={(v) => set({ salaryIsEstimate: v })}
          label="Salary is still an estimate"
        />
        <Toggle
          checked={t?.contractSigned ?? false}
          onChange={(v) =>
            set({
              contractSigned: v,
              contractSignedDate: v ? new Date().toISOString().slice(0, 10) : null,
            })
          }
          label="Employment contract signed"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Expected shift structure">
          <Input
            defaultValue={t?.expectedShiftStructure ?? ""}
            placeholder="e.g. 14 shifts/month, nights rotating"
            onBlur={(e) => set({ expectedShiftStructure: e.target.value })}
          />
        </Field>
        <Field label="Expected bonus / incentive structure">
          <Input
            defaultValue={t?.expectedBonusStructure ?? ""}
            placeholder="Sign-on, RVU, retention…"
            onBlur={(e) => set({ expectedBonusStructure: e.target.value })}
          />
        </Field>
        <Field label="Contract contingencies">
          <Input
            defaultValue={t?.contractContingencies ?? ""}
            placeholder="Licensure, credentialing, board eligibility…"
            onBlur={(e) => set({ contractContingencies: e.target.value })}
          />
        </Field>
        <Field label="Credentialing status">
          <Input
            defaultValue={t?.credentialingStatus ?? ""}
            placeholder="Not started / in progress / complete"
            onBlur={(e) => set({ credentialingStatus: e.target.value })}
          />
        </Field>
      </div>

      <div className="rounded-lg border border-line bg-surface-muted/40 p-4">
        <h4 className="mb-3 text-sm font-medium text-ink">Lender treatment of future income</h4>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="How a lender will treat this income">
            <Select
              value={t?.lenderIncomeTreatment ?? "not-yet-asked"}
              onChange={(e) =>
                set({ lenderIncomeTreatment: e.target.value as AttendingTransition["lenderIncomeTreatment"] })
              }
            >
              {TREATMENT.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Max months from closing to start date allowed">
            <Input
              type="number"
              inputMode="numeric"
              defaultValue={t?.maxMonthsClosingToStart ?? ""}
              placeholder="e.g. 3"
              onBlur={(e) =>
                set({ maxMonthsClosingToStart: e.target.value === "" ? null : Number(e.target.value) })
              }
            />
          </Field>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Required reserves note">
            <Input
              defaultValue={t?.requiredReservesNote ?? ""}
              placeholder="e.g. 6 months PITI"
              onBlur={(e) => set({ requiredReservesNote: e.target.value })}
            />
          </Field>
          <Field label="Required employment documentation">
            <Input
              defaultValue={t?.requiredDocumentationNote ?? ""}
              placeholder="Contract, offer letter, VOE…"
              onBlur={(e) => set({ requiredDocumentationNote: e.target.value })}
            />
          </Field>
        </div>
        <Field label="Lender treatment notes" className="mt-4">
          <Textarea
            rows={2}
            defaultValue={t?.lenderTreatmentNotes ?? ""}
            placeholder="Which lender said what, and when…"
            onBlur={(e) => set({ lenderTreatmentNotes: e.target.value })}
          />
        </Field>

        {notConfirmed && (
          <Callout tone="critical" className="mt-3">
            Do not base an offer on expected attending income until a lender confirms in writing how that
            income will be treated.
          </Callout>
        )}
      </div>

      <Field label="Notes">
        <Textarea
          rows={2}
          defaultValue={t?.notes ?? ""}
          onBlur={(e) => set({ notes: e.target.value })}
        />
      </Field>
    </div>
  );
}
