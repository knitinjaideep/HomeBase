"use client";

import { useState } from "react";
import type {
  AgentScorecard,
  AgentVerification,
  Professional,
  SelectionStatus,
} from "@/lib/models";
import { deleteProfessional, saveProfessional, selectProfessional, updateProfessional } from "@/lib/repo";
import { interviewQuestionsForRole } from "@/lib/guide";
import {
  Button,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
  Chip,
  Callout,
  RatingInput,
} from "@/components/ui";
import { PROFESSIONAL_ROLE_LABELS, SELECTION_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/util";

const TAB_BASE = "px-3 py-1.5 text-sm font-medium rounded-md transition-colors";

/** Full editor for one professional. Tabs keep the many fields manageable. */
export function ProfessionalDetail({ professional }: { professional: Professional }) {
  const isAgent = professional.role === "buyer-agent";
  const [tab, setTab] = useState<"contact" | "verify" | "interview" | "scorecard">("contact");
  const set = (patch: Partial<Professional>) => void updateProfessional(professional.id, patch);

  const tabs: { id: typeof tab; label: string; show: boolean }[] = [
    { id: "contact", label: "Contact & fit", show: true },
    { id: "verify", label: "Verification", show: isAgent },
    { id: "interview", label: "Interview", show: Boolean(interviewQuestionsForRole(professional.role)) },
    { id: "scorecard", label: "Scorecard", show: isAgent },
  ];

  return (
    <div className="mt-4 border-t border-line pt-4">
      <div className="mb-4 inline-flex flex-wrap gap-1 rounded-lg bg-surface-muted p-1">
        {tabs
          .filter((t) => t.show)
          .map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(TAB_BASE, tab === t.id ? "bg-surface text-ink shadow-sm" : "text-ink-muted hover:text-ink")}
            >
              {t.label}
            </button>
          ))}
      </div>

      {tab === "contact" && <ContactTab professional={professional} set={set} />}
      {tab === "verify" && isAgent && <VerificationTab professional={professional} />}
      {tab === "interview" && <InterviewTab professional={professional} />}
      {tab === "scorecard" && isAgent && <ScorecardTab professional={professional} />}

      <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
        <Button
          variant="danger"
          size="sm"
          onClick={() => {
            if (confirm(`Remove ${professional.name}?`)) void deleteProfessional(professional.id);
          }}
        >
          Remove
        </Button>
        <div className="text-xs text-ink-subtle">Changes save automatically.</div>
      </div>
    </div>
  );
}

function ContactTab({ professional, set }: { professional: Professional; set: (p: Partial<Professional>) => void }) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Company">
          <Input defaultValue={professional.company} onBlur={(e) => set({ company: e.target.value })} />
        </Field>
        <Field label="Phone">
          <Input defaultValue={professional.phone} onBlur={(e) => set({ phone: e.target.value })} />
        </Field>
        <Field label="Email">
          <Input defaultValue={professional.email} onBlur={(e) => set({ email: e.target.value })} />
        </Field>
        <Field label="Website">
          <Input defaultValue={professional.website} onBlur={(e) => set({ website: e.target.value })} />
        </Field>
        <Field label="Town coverage">
          <Input defaultValue={professional.townCoverage} onBlur={(e) => set({ townCoverage: e.target.value })} />
        </Field>
        <Field label="Licence info">
          <Input defaultValue={professional.licenseInfo} onBlur={(e) => set({ licenseInfo: e.target.value })} />
        </Field>
        <Field label="Fee estimate ($)">
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={professional.feeEstimate ?? ""}
            onBlur={(e) => set({ feeEstimate: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
        <Field label="Referral source detail">
          <Input
            defaultValue={professional.referralSourceDetail}
            placeholder="Who referred them / how we found them"
            onBlur={(e) => set({ referralSourceDetail: e.target.value })}
          />
        </Field>
        <Field label="Interview date">
          <Input
            type="date"
            value={professional.interviewDate ?? ""}
            onChange={(e) => set({ interviewDate: e.target.value || null })}
          />
        </Field>
      </div>
      <Field label="Concerns or conflicts">
        <Textarea rows={2} defaultValue={professional.concerns} onBlur={(e) => set({ concerns: e.target.value })} />
      </Field>
      <Field label="Notes">
        <Textarea rows={2} defaultValue={professional.notes} onBlur={(e) => set({ notes: e.target.value })} />
      </Field>
      <Field label="Shared spouse decision note" hint="What we decided together and why.">
        <Textarea
          rows={2}
          defaultValue={professional.spouseDecisionNote}
          onBlur={(e) => set({ spouseDecisionNote: e.target.value })}
        />
      </Field>
    </div>
  );
}

const VERIFY_TEXT_FIELDS: { key: keyof AgentVerification; label: string; placeholder?: string }[] = [
  { key: "njLicenseNumber", label: "NJ licence number" },
  { key: "brokerage", label: "Brokerage" },
  { key: "primaryServiceArea", label: "Primary service area" },
  { key: "buyerSideExperience", label: "Buyer-side experience" },
  { key: "recentTransactionsInTargetTowns", label: "Recent transactions in our target towns", placeholder: "Concrete, recent, buyer-side" },
  { key: "physicianMortgageExperience", label: "Experience with physician mortgages" },
  { key: "competitiveOfferExperience", label: "Experience with competitive offers" },
  { key: "olderNjHomeExperience", label: "Experience with older NJ homes" },
  { key: "trainCommuteFamiliarity", label: "Familiarity with train commuting / parking" },
  { key: "attorneyReviewFamiliarity", label: "Familiarity with attorney review" },
  { key: "localInspectionFamiliarity", label: "Familiarity with local inspections" },
  { key: "referencesContacted", label: "References contacted" },
  { key: "communicationStyle", label: "Communication style" },
  { key: "availability", label: "Availability" },
  { key: "coverageWhenUnavailable", label: "Coverage when unavailable" },
  { key: "conflictsOfInterest", label: "Conflicts of interest" },
  { key: "compensationStructure", label: "Compensation structure" },
];

function VerificationTab({ professional }: { professional: Professional }) {
  const v = professional.agentVerification;
  const setV = (patch: Partial<AgentVerification>) =>
    void updateProfessional(professional.id, { agentVerification: { ...v, ...patch } });

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Years of experience">
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={v.yearsExperience ?? ""}
            onBlur={(e) => setV({ yearsExperience: e.target.value === "" ? null : Number(e.target.value) })}
          />
        </Field>
        <Field label="Buyers represented in last 12 months">
          <Input
            type="number"
            inputMode="numeric"
            defaultValue={v.buyersRepresentedLast12Months ?? ""}
            onBlur={(e) =>
              setV({ buyersRepresentedLast12Months: e.target.value === "" ? null : Number(e.target.value) })
            }
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-6">
        <Toggle
          checked={v.isFullTime ?? false}
          onChange={(val) => setV({ isFullTime: val })}
          label="Full-time agent"
        />
        <Toggle
          checked={v.buyerAgreementReviewed}
          onChange={(val) => setV({ buyerAgreementReviewed: val })}
          label="Buyer agreement reviewed"
        />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {VERIFY_TEXT_FIELDS.map((f) => (
          <Field key={f.key} label={f.label}>
            <Input
              defaultValue={(v[f.key] as string) ?? ""}
              placeholder={f.placeholder}
              onBlur={(e) => setV({ [f.key]: e.target.value } as Partial<AgentVerification>)}
            />
          </Field>
        ))}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Buyer-agreement terms">
          <Textarea rows={2} defaultValue={v.buyerAgreementTerms} onBlur={(e) => setV({ buyerAgreementTerms: e.target.value })} />
        </Field>
        <Field label="Agreement duration & termination">
          <Textarea
            rows={2}
            defaultValue={`${v.buyerAgreementDurationNote}${v.buyerAgreementTerminationNote ? "\n" + v.buyerAgreementTerminationNote : ""}`}
            onBlur={(e) => setV({ buyerAgreementDurationNote: e.target.value })}
          />
        </Field>
      </div>
      <Callout tone="neutral">
        Verify the licence and brokerage against the New Jersey licensee search, and confirm recent local
        transactions with concrete examples — popularity and volume alone are not enough.
      </Callout>
    </div>
  );
}

function InterviewTab({ professional }: { professional: Professional }) {
  const set = interviewQuestionsForRole(professional.role);
  if (!set) return <p className="text-sm text-ink-muted">No interview bank for this role.</p>;
  const answers = professional.interviewAnswers;

  const saveAnswer = (qid: string, value: string) =>
    void updateProfessional(professional.id, { interviewAnswers: { ...answers, [qid]: value } });

  return (
    <div className="space-y-3">
      {set.intro && <p className="text-xs text-ink-subtle">{set.intro}</p>}
      {set.questions.map((q, i) => (
        <div key={q.id} className="rounded-lg border border-line bg-surface p-3">
          <div className="flex gap-2 text-sm">
            <span className="shrink-0 font-display text-ink-subtle">{i + 1}.</span>
            <div className="flex-1">
              <p className="text-ink">{q.question}</p>
              {q.listenFor && <p className="mt-0.5 text-xs text-ink-subtle">Listen for: {q.listenFor}</p>}
              <Textarea
                className="mt-2"
                rows={2}
                defaultValue={answers[q.id] ?? ""}
                placeholder="Their answer…"
                onBlur={(e) => saveAnswer(q.id, e.target.value)}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

const SCORECARD_FIELDS: { key: keyof AgentScorecard; label: string }[] = [
  { key: "targetTownExpertise", label: "Target-town expertise" },
  { key: "buyerAdvocacy", label: "Buyer advocacy" },
  { key: "financialDiscipline", label: "Financial discipline" },
  { key: "communication", label: "Communication" },
  { key: "responsiveness", label: "Responsiveness" },
  { key: "negotiationApproach", label: "Negotiation approach" },
  { key: "localProfessionalNetwork", label: "Local professional network" },
  { key: "understandsOurPriorities", label: "Understands our priorities" },
  { key: "comfortDiscussingCompensation", label: "Comfort discussing compensation" },
  { key: "contractTransparency", label: "Contract transparency" },
  { key: "personalityFit", label: "Personality fit" },
  { key: "overallConfidence", label: "Overall confidence" },
];

function ScorecardTab({ professional }: { professional: Professional }) {
  const sc = professional.agentScorecard;
  const setSc = (patch: Partial<AgentScorecard>) =>
    void updateProfessional(professional.id, { agentScorecard: { ...sc, ...patch } });

  const rated = SCORECARD_FIELDS.map((f) => sc[f.key]).filter((x): x is number => x !== null);
  const avg = rated.length ? (rated.reduce((a, b) => a + b, 0) / rated.length).toFixed(1) : "—";

  return (
    <div className="space-y-2">
      <Callout tone="neutral">
        The average is shown for reference only. Do not automatically choose the highest score — choose the
        person you trust to protect the decision, and record why in the spouse decision note.
      </Callout>
      {SCORECARD_FIELDS.map((f) => (
        <div key={f.key} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 py-2">
          <span className="text-sm text-ink">{f.label}</span>
          <RatingInput value={sc[f.key]} onChange={(v) => setSc({ [f.key]: v } as Partial<AgentScorecard>)} ariaLabel={f.label} />
        </div>
      ))}
      <div className="flex items-center justify-between rounded-lg bg-surface-muted px-3 py-2">
        <span className="text-sm font-medium text-ink">Average (reference only)</span>
        <span className="font-display text-lg text-ink">{avg} / 5</span>
      </div>
    </div>
  );
}

/** The compact header row shown whether or not the detail is expanded. */
export function SelectionControls({ professional }: { professional: Professional }) {
  return (
    <div className="flex items-center gap-2">
      <Chip tone={professional.selectionStatus === "selected" ? "accent" : "neutral"}>
        {SELECTION_STATUS_LABELS[professional.selectionStatus]}
      </Chip>
      <Select
        className="h-8 min-h-0 w-auto py-0 text-xs"
        value={professional.selectionStatus}
        onChange={(e) => {
          const status = e.target.value as SelectionStatus;
          if (status === "selected") {
            void selectProfessional(professional.id);
          } else {
            void saveProfessional({ ...professional, selectionStatus: status });
          }
        }}
      >
        {(Object.keys(SELECTION_STATUS_LABELS) as SelectionStatus[]).map((s) => (
          <option key={s} value={s}>
            {SELECTION_STATUS_LABELS[s]}
          </option>
        ))}
      </Select>
    </div>
  );
}

/** Role label helper re-exported for the list page. */
export function roleLabel(role: Professional["role"]): string {
  return PROFESSIONAL_ROLE_LABELS[role];
}
