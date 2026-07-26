"use client";

import { useState } from "react";
import type {
  Deal,
  FinancialProfile,
  InspectionRecord,
  InspectionType,
  NegotiationEntry,
  Property,
} from "@/lib/models";
import { inspectionTypeSchema } from "@/lib/models";
import { ensureDeal, updateDeal } from "@/lib/repo";
import { newId } from "@/lib/util";
import { money, dateLabel } from "@/lib/format";
import { Panel, Button, Field, Input, Textarea, Callout, Toggle, Select } from "@/components/ui";
import { StepSection } from "@/components/journey/journey-ui";
import { cn } from "@/lib/util";
import { useSaveStatus } from "@/lib/data/save-status";
import { SaveIndicator } from "@/components/save-indicator";

/**
 * The per-property deal — journey stages 12–18. Created lazily: a property has
 * no deal until offer preparation begins. The walk-away price is shown
 * prominently and is never raised automatically by the app.
 */
export function DealSection({
  property,
  deal,
  financial,
}: {
  property: Property;
  deal: Deal | undefined;
  financial: FinancialProfile;
}) {
  if (!deal) {
    return (
      <Panel className="p-5">
        <div className="flex flex-col items-start gap-3">
          <h2 className="font-display text-lg text-ink">Offer & deal</h2>
          <p className="text-sm text-ink-muted">
            Once we are seriously considering an offer on this house, start its deal to work through offer
            preparation, negotiation, attorney review, inspections, financing, and closing — with our
            walk-away price front and centre.
          </p>
          <Button onClick={() => void ensureDeal(property.id)}>Start offer preparation</Button>
        </div>
      </Panel>
    );
  }
  return <DealBody property={property} deal={deal} financial={financial} />;
}

function DealBody({
  property,
  deal,
  financial,
}: {
  property: Property;
  deal: Deal;
  financial: FinancialProfile;
}) {
  const saveStatus = useSaveStatus();
  const set = (patch: Partial<Deal>) => void saveStatus.run(() => updateDeal(property.id, patch));
  const walkAway = deal.walkAwayPrice;
  const proposed = property.offerPrice ?? deal.offer.initialOfferPrice;
  const overWalkAway = walkAway != null && proposed != null && proposed > walkAway;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-display text-xl text-ink">Offer & deal</h2>
        <SaveIndicator status={saveStatus.status} error={saveStatus.error} onRetry={saveStatus.retry} />
      </div>

      {/* Prominent walk-away banner */}
      <Panel
        className={cn(
          "p-5",
          overWalkAway ? "border-critical/50 bg-critical/[0.06]" : "border-accent/30 bg-accent-soft/40",
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="text-sm font-medium text-ink">Our walk-away price</div>
            <p className="mt-0.5 max-w-md text-xs text-ink-muted">
              Decided before negotiating and kept private. The app displays it here and never raises it
              because of competition.
            </p>
          </div>
          <div className="w-full sm:w-56">
            <Input
              type="number"
              inputMode="numeric"
              className="text-right font-display text-xl"
              defaultValue={walkAway ?? ""}
              placeholder="Set the number"
              onBlur={(e) =>
                set({
                  walkAwayPrice: e.target.value === "" ? null : Number(e.target.value),
                  walkAwayRecordedAt: e.target.value === "" ? null : new Date().toISOString(),
                })
              }
            />
          </div>
        </div>
        <Field label="Why this number" className="mt-3">
          <Textarea
            rows={2}
            defaultValue={deal.walkAwayReasoning}
            onBlur={(e) => set({ walkAwayReasoning: e.target.value })}
          />
        </Field>
        {deal.walkAwayRecordedAt && (
          <p className="mt-2 text-xs text-ink-subtle">Recorded {dateLabel(deal.walkAwayRecordedAt)}.</p>
        )}
        {overWalkAway && (
          <Callout tone="critical" className="mt-3">
            The current proposed price ({money(proposed)}) is above our walk-away price. This is a moment to
            stop and reconsider — not to raise the number.
          </Callout>
        )}
      </Panel>

      {/* Offer readiness */}
      <StepSection title="Offer readiness" collapsible defaultOpen>
        <ReadinessGrid deal={deal} onChange={(patch) => set({ readiness: { ...deal.readiness, ...patch } })} />
      </StepSection>

      {/* Offer terms */}
      <StepSection title="Offer terms" collapsible defaultOpen={false}>
        <OfferTermsForm deal={deal} onChange={(patch) => set({ offer: { ...deal.offer, ...patch } })} />
      </StepSection>

      {/* Negotiation log */}
      <StepSection title="Negotiation log" collapsible defaultOpen={false} count={deal.negotiationLog.length}>
        <NegotiationLog
          deal={deal}
          onChange={(log) => set({ negotiationLog: log })}
        />
      </StepSection>

      {/* Attorney review */}
      <StepSection title="Attorney review" collapsible defaultOpen={false}>
        <Callout tone="caution" className="mb-3">
          This app does not provide legal advice. Attorney review is where a real attorney earns their fee.
        </Callout>
        <AttorneyReviewForm deal={deal} onChange={(patch) => set({ attorneyReview: { ...deal.attorneyReview, ...patch } })} />
      </StepSection>

      {/* Inspections */}
      <StepSection title="Inspections & due diligence" collapsible defaultOpen={false} count={deal.inspections.length}>
        <Inspections deal={deal} onChange={(inspections) => set({ inspections })} />
      </StepSection>

      {/* Financing */}
      <StepSection title="Finalize financing" collapsible defaultOpen={false}>
        <Callout tone="critical" className="mb-3">
          Never rely solely on emailed wire instructions. Verify closing instructions using a trusted phone
          number you found independently — not one from the email.
        </Callout>
        <FinancingForm deal={deal} onChange={(patch) => set({ financing: { ...deal.financing, ...patch } })} />
      </StepSection>

      {/* Closing prep */}
      <StepSection title="Prepare for closing" collapsible defaultOpen={false}>
        <ClosingPrepForm deal={deal} onChange={(patch) => set({ closingPrep: { ...deal.closingPrep, ...patch } })} />
      </StepSection>

      {/* Post-closing */}
      <StepSection title="Closing & post-closing" collapsible defaultOpen={false}>
        <PostClosingForm
          deal={deal}
          financial={financial}
          onChange={(patch) => set({ postClosing: { ...deal.postClosing, ...patch } })}
        />
      </StepSection>
    </div>
  );
}

// ---- Reusable check grid --------------------------------------------------

function CheckGrid<T extends Record<string, unknown>>({
  source,
  fields,
  onChange,
}: {
  source: T;
  fields: [keyof T & string, string][];
  onChange: (patch: Partial<T>) => void;
}) {
  return (
    <div className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {fields.map(([key, label]) => (
        <label
          key={key}
          className="flex cursor-pointer items-center gap-2.5 rounded-md px-2 py-1.5 text-sm hover:bg-surface-muted"
        >
          <input
            type="checkbox"
            checked={Boolean(source[key])}
            onChange={(e) => onChange({ [key]: e.target.checked } as Partial<T>)}
            className="h-4 w-4 accent-[rgb(var(--accent))]"
          />
          <span className="text-ink">{label}</span>
        </label>
      ))}
    </div>
  );
}

function ReadinessGrid({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (patch: Partial<Deal["readiness"]>) => void;
}) {
  return (
    <CheckGrid
      source={deal.readiness}
      onChange={onChange}
      fields={[
        ["schoolsVerified", "Assigned schools verified"],
        ["taxesVerified", "Property taxes verified"],
        ["floodStatusReviewed", "Flood status reviewed"],
        ["commuteTested", "Commute tested"],
        ["comparableSalesReviewed", "Comparable sales reviewed"],
        ["monthlyPaymentCalculated", "Monthly payment calculated"],
        ["cashAtClosingCalculated", "Cash at closing calculated"],
        ["postClosingReserveCalculated", "Post-closing reserve calculated"],
        ["renovationEstimateEntered", "Renovation estimate entered"],
        ["insuranceAvailabilityConsidered", "Insurance availability considered"],
        ["listingDisclosuresReviewed", "Listing disclosures reviewed"],
        ["contingenciesReviewed", "Contingencies reviewed"],
        ["attorneyIdentified", "Attorney identified"],
        ["lenderConfirmedScenario", "Lender confirmed this scenario"],
        ["appraisalGapUnderstood", "Appraisal-gap exposure understood"],
        ["inspectionStrategyDocumented", "Inspection strategy documented"],
        ["buyer1Approves", "Buyer 1 approves"],
        ["buyer2Approves", "Buyer 2 approves"],
      ]}
    />
  );
}

function OfferTermsForm({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (patch: Partial<Deal["offer"]>) => void;
}) {
  const o = deal.offer;
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <Field label="Initial offer price">
        <Input
          type="number"
          inputMode="numeric"
          defaultValue={o.initialOfferPrice ?? ""}
          onBlur={(e) => onChange({ initialOfferPrice: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </Field>
      <Field label="Earnest money">
        <Input
          type="number"
          inputMode="numeric"
          defaultValue={o.earnestMoney ?? ""}
          onBlur={(e) => onChange({ earnestMoney: e.target.value === "" ? null : Number(e.target.value) })}
        />
      </Field>
      <Field label="Escalation terms">
        <Input defaultValue={o.escalationTerms} onBlur={(e) => onChange({ escalationTerms: e.target.value })} />
      </Field>
      <Field label="Proposed closing date">
        <Input type="date" value={o.proposedClosingDate ?? ""} onChange={(e) => onChange({ proposedClosingDate: e.target.value || null })} />
      </Field>
      <Field label="Financing contingency">
        <Input defaultValue={o.financingContingency} onBlur={(e) => onChange({ financingContingency: e.target.value })} />
      </Field>
      <Field label="Appraisal terms">
        <Input defaultValue={o.appraisalTerms} onBlur={(e) => onChange({ appraisalTerms: e.target.value })} />
      </Field>
      <Field label="Inspection terms">
        <Input defaultValue={o.inspectionTerms} onBlur={(e) => onChange({ inspectionTerms: e.target.value })} />
      </Field>
      <Field label="Seller concessions">
        <Input defaultValue={o.sellerConcessions} onBlur={(e) => onChange({ sellerConcessions: e.target.value })} />
      </Field>
      <Field label="Included items">
        <Input defaultValue={o.includedItems} onBlur={(e) => onChange({ includedItems: e.target.value })} />
      </Field>
      <Field label="Excluded items">
        <Input defaultValue={o.excludedItems} onBlur={(e) => onChange({ excludedItems: e.target.value })} />
      </Field>
      <Field label="Final accepted terms" className="sm:col-span-2">
        <Textarea rows={2} defaultValue={o.finalAcceptedTerms} onBlur={(e) => onChange({ finalAcceptedTerms: e.target.value })} />
      </Field>
    </div>
  );
}

function NegotiationLog({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (log: NegotiationEntry[]) => void;
}) {
  const [summary, setSummary] = useState("");
  const [party, setParty] = useState<NegotiationEntry["party"]>("us");
  const [amount, setAmount] = useState("");
  const [reasoning, setReasoning] = useState("");

  const add = () => {
    if (!summary.trim()) return;
    const entry: NegotiationEntry = {
      id: newId(),
      at: new Date().toISOString(),
      party,
      summary: summary.trim(),
      amount: amount === "" ? null : Number(amount),
      reasoning: reasoning.trim(),
    };
    onChange([...deal.negotiationLog, entry]);
    setSummary("");
    setAmount("");
    setReasoning("");
  };

  return (
    <div className="space-y-3">
      {deal.negotiationLog.length > 0 && (
        <ol className="space-y-2">
          {deal.negotiationLog.map((entry) => (
            <li key={entry.id} className="rounded-lg border border-line bg-surface p-3 text-sm">
              <div className="flex items-center justify-between">
                <span className="font-medium capitalize text-ink">{entry.party}</span>
                <span className="text-xs text-ink-subtle">{dateLabel(entry.at)}</span>
              </div>
              <p className="mt-0.5 text-ink">
                {entry.summary}
                {entry.amount != null ? ` — ${money(entry.amount)}` : ""}
              </p>
              {entry.reasoning && <p className="mt-0.5 text-xs text-ink-subtle">Why: {entry.reasoning}</p>}
              <button
                onClick={() => onChange(deal.negotiationLog.filter((x) => x.id !== entry.id))}
                className="mt-1 text-xs text-critical hover:underline"
              >
                Remove
              </button>
            </li>
          ))}
        </ol>
      )}
      <div className="rounded-lg border border-line bg-surface-muted/40 p-3">
        <div className="grid gap-2 sm:grid-cols-4">
          <Field label="Who">
            <Select value={party} onChange={(e) => setParty(e.target.value as NegotiationEntry["party"])}>
              <option value="us">Us</option>
              <option value="seller">Seller</option>
              <option value="note">Note</option>
            </Select>
          </Field>
          <Field label="Amount" className="sm:col-span-1">
            <Input type="number" inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value)} />
          </Field>
          <Field label="What happened" className="sm:col-span-2">
            <Input value={summary} onChange={(e) => setSummary(e.target.value)} placeholder="e.g. countered at…" />
          </Field>
        </div>
        <Field label="Why we accepted / rejected" className="mt-2">
          <Input value={reasoning} onChange={(e) => setReasoning(e.target.value)} />
        </Field>
        <Button size="sm" className="mt-2" onClick={add}>
          Add to log
        </Button>
      </div>
    </div>
  );
}

function AttorneyReviewForm({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (patch: Partial<Deal["attorneyReview"]>) => void;
}) {
  const a = deal.attorneyReview;
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-6">
        <Toggle checked={a.attorneyRetained} onChange={(v) => onChange({ attorneyRetained: v })} label="Attorney retained" />
        <Toggle
          checked={a.attorneyApproved}
          onChange={(v) => onChange({ attorneyApproved: v, attorneyApprovedDate: v ? new Date().toISOString().slice(0, 10) : null })}
          label="Attorney approved"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Contract received">
          <Input type="date" value={a.contractReceivedDate ?? ""} onChange={(e) => onChange({ contractReceivedDate: e.target.value || null })} />
        </Field>
        <Field label="Review deadline">
          <Input type="date" value={a.reviewDeadline ?? ""} onChange={(e) => onChange({ reviewDeadline: e.target.value || null })} />
        </Field>
        <Field label="Requested changes">
          <Textarea rows={2} defaultValue={a.requestedChanges} onBlur={(e) => onChange({ requestedChanges: e.target.value })} />
        </Field>
        <Field label="Agreed changes">
          <Textarea rows={2} defaultValue={a.agreedChanges} onBlur={(e) => onChange({ agreedChanges: e.target.value })} />
        </Field>
        <Field label="Open issues">
          <Textarea rows={2} defaultValue={a.openIssues} onBlur={(e) => onChange({ openIssues: e.target.value })} />
        </Field>
        <Field label="Final contract location (a note)">
          <Input defaultValue={a.finalContractLocation} onBlur={(e) => onChange({ finalContractLocation: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

const INSPECTION_TYPES = inspectionTypeSchema.options as InspectionType[];

function Inspections({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (inspections: InspectionRecord[]) => void;
}) {
  const [type, setType] = useState<InspectionType>("general");

  const add = () => {
    const rec: InspectionRecord = {
      id: newId(),
      type,
      ordered: false,
      inspectorName: "",
      inspectorProfessionalId: null,
      date: null,
      cost: null,
      findings: "",
      severity: "unknown",
      estimatedRepairCost: null,
      specialistFollowUp: "",
      sellerResponse: "",
      creditRequested: null,
      repairRequested: "",
      resolution: "open",
      notes: "",
    };
    onChange([...deal.inspections, rec]);
  };

  const update = (id: string, patch: Partial<InspectionRecord>) =>
    onChange(deal.inspections.map((i) => (i.id === id ? { ...i, ...patch } : i)));

  return (
    <div className="space-y-3">
      {deal.inspections.map((rec) => (
        <div key={rec.id} className="rounded-lg border border-line bg-surface p-3">
          <div className="mb-2 flex items-center justify-between">
            <span className="font-medium capitalize text-ink">{rec.type.replace(/-/g, " ")}</span>
            <button onClick={() => onChange(deal.inspections.filter((x) => x.id !== rec.id))} className="text-xs text-critical hover:underline">
              Remove
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-3">
            <Field label="Inspector">
              <Input defaultValue={rec.inspectorName} onBlur={(e) => update(rec.id, { inspectorName: e.target.value })} />
            </Field>
            <Field label="Date">
              <Input type="date" value={rec.date ?? ""} onChange={(e) => update(rec.id, { date: e.target.value || null })} />
            </Field>
            <Field label="Cost">
              <Input type="number" inputMode="numeric" defaultValue={rec.cost ?? ""} onBlur={(e) => update(rec.id, { cost: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Severity">
              <Select value={rec.severity} onChange={(e) => update(rec.id, { severity: e.target.value as InspectionRecord["severity"] })}>
                {["unknown", "none", "minor", "moderate", "major", "deal-breaker"].map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g, " ")}</option>
                ))}
              </Select>
            </Field>
            <Field label="Est. repair cost">
              <Input type="number" inputMode="numeric" defaultValue={rec.estimatedRepairCost ?? ""} onBlur={(e) => update(rec.id, { estimatedRepairCost: e.target.value === "" ? null : Number(e.target.value) })} />
            </Field>
            <Field label="Resolution">
              <Select value={rec.resolution} onChange={(e) => update(rec.id, { resolution: e.target.value as InspectionRecord["resolution"] })}>
                {["open", "credit-agreed", "repair-agreed", "seller-declined", "accepted-risk", "walking-away", "not-applicable"].map((s) => (
                  <option key={s} value={s}>{s.replace(/-/g, " ")}</option>
                ))}
              </Select>
            </Field>
          </div>
          <Field label="Findings" className="mt-2">
            <Textarea rows={2} defaultValue={rec.findings} onBlur={(e) => update(rec.id, { findings: e.target.value })} />
          </Field>
          <Field label="Seller response" className="mt-2">
            <Input defaultValue={rec.sellerResponse} onBlur={(e) => update(rec.id, { sellerResponse: e.target.value })} />
          </Field>
        </div>
      ))}
      <div className="flex items-end gap-2 rounded-lg border border-line bg-surface-muted/40 p-3">
        <Field label="Add inspection" className="w-56">
          <Select value={type} onChange={(e) => setType(e.target.value as InspectionType)}>
            {INSPECTION_TYPES.map((t) => (
              <option key={t} value={t}>{t.replace(/-/g, " ")}</option>
            ))}
          </Select>
        </Field>
        <Button size="sm" onClick={add}>Add</Button>
      </div>
    </div>
  );
}

function FinancingForm({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (patch: Partial<Deal["financing"]>) => void;
}) {
  const f = deal.financing;
  return (
    <div className="space-y-3">
      <CheckGrid
        source={f}
        onChange={onChange}
        fields={[
          ["loanApplicationSubmitted", "Loan application submitted"],
          ["loanEstimateReceived", "Loan Estimate received"],
          ["rateLocked", "Rate locked"],
          ["appraisalOrdered", "Appraisal ordered"],
          ["underwritingSubmitted", "Underwriting submitted"],
          ["conditionalApproval", "Conditional approval"],
          ["homeownersInsuranceBound", "Homeowners insurance bound"],
          ["clearToClose", "Clear to close"],
          ["closingDisclosureReceived", "Closing Disclosure received"],
          ["wireInstructionsVerifiedByPhone", "Wire instructions verified by phone"],
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Selected lender">
          <Input defaultValue={f.selectedLender} onBlur={(e) => onChange({ selectedLender: e.target.value })} />
        </Field>
        <Field label="Locked rate (%)">
          <Input type="number" step="0.001" defaultValue={f.lockedRatePct ?? ""} onBlur={(e) => onChange({ lockedRatePct: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Appraisal result">
          <Input type="number" inputMode="numeric" defaultValue={f.appraisalResult ?? ""} onBlur={(e) => onChange({ appraisalResult: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Final cash to close">
          <Input type="number" inputMode="numeric" defaultValue={f.finalCashToClose ?? ""} onBlur={(e) => onChange({ finalCashToClose: e.target.value === "" ? null : Number(e.target.value) })} />
        </Field>
        <Field label="Outstanding conditions" className="sm:col-span-2">
          <Textarea rows={2} defaultValue={f.outstandingConditions} onBlur={(e) => onChange({ outstandingConditions: e.target.value })} />
        </Field>
        <Field label="Competing Loan Estimates" className="sm:col-span-2">
          <Textarea rows={2} defaultValue={f.competingLoanEstimates} onBlur={(e) => onChange({ competingLoanEstimates: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}

function ClosingPrepForm({
  deal,
  onChange,
}: {
  deal: Deal;
  onChange: (patch: Partial<Deal["closingPrep"]>) => void;
}) {
  return (
    <CheckGrid
      source={deal.closingPrep}
      onChange={onChange}
      fields={[
        ["finalWalkthroughScheduled", "Final walkthrough scheduled"],
        ["utilitiesArranged", "Utilities arranged"],
        ["movingArranged", "Moving arranged"],
        ["closingFundsReady", "Closing funds ready"],
        ["fundsMethodConfirmed", "Funds method confirmed"],
        ["closingDisclosureReviewed", "Closing Disclosure reviewed"],
        ["identificationReady", "Identification ready"],
        ["insuranceActive", "Insurance active"],
        ["propertyConditionRechecked", "Property condition rechecked"],
        ["agreedRepairsVerified", "Agreed repairs verified"],
        ["appliancesAndFixturesVerified", "Appliances & fixtures verified"],
        ["keysAndAccessConfirmed", "Keys & access confirmed"],
      ]}
    />
  );
}

function PostClosingForm({
  deal,
  financial,
  onChange,
}: {
  deal: Deal;
  financial: FinancialProfile;
  onChange: (patch: Partial<Deal["postClosing"]>) => void;
}) {
  const pc = deal.postClosing;
  const reserveShort =
    pc.actualPostClosingReserve != null &&
    financial.minReserve != null &&
    pc.actualPostClosingReserve < financial.minReserve;

  return (
    <div className="space-y-3">
      <CheckGrid
        source={pc}
        onChange={onChange}
        fields={[
          ["closingCompleted", "Closing completed"],
          ["finalDocumentsSaved", "Final documents saved"],
          ["keysReceived", "Keys received"],
          ["locksChanged", "Locks changed"],
          ["utilitiesConfirmed", "Utilities confirmed"],
          ["emergencyShutoffsLocated", "Emergency shutoffs located"],
          ["homeSystemsDocumented", "Home systems documented"],
          ["warrantiesStored", "Warranties stored"],
          ["maintenanceCalendarCreated", "Maintenance calendar created"],
          ["firstMortgagePaymentRecorded", "First mortgage payment recorded"],
          ["addressChangesCompleted", "Address changes completed"],
          ["postClosingReserveVerified", "Post-closing reserve verified"],
        ]}
      />
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Actual post-closing reserve" hint={`Minimum is ${money(financial.minReserve)}.`}>
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={pc.actualPostClosingReserve ?? ""}
            onBlur={(e) => onChange({ actualPostClosingReserve: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
      </div>
      {reserveShort && (
        <Callout tone="critical">
          The actual post-closing reserve is below our minimum. This is exactly the outcome the whole plan
          was built to avoid — worth a hard look at the budget.
        </Callout>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="30-day repair list">
          <Textarea rows={2} defaultValue={pc.thirtyDayRepairList} onBlur={(e) => onChange({ thirtyDayRepairList: e.target.value })} />
        </Field>
        <Field label="One-year maintenance plan">
          <Textarea rows={2} defaultValue={pc.oneYearMaintenancePlan} onBlur={(e) => onChange({ oneYearMaintenancePlan: e.target.value })} />
        </Field>
      </div>
    </div>
  );
}
