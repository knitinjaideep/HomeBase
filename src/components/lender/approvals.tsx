"use client";

import { useState } from "react";
import { useApprovals } from "@/lib/hooks";
import { createApproval, deleteApproval, updateApproval } from "@/lib/repo";
import type { ApprovalKind, MortgageApproval } from "@/lib/models";
import { APPROVAL_KIND_HINTS, APPROVAL_KIND_LABELS } from "@/lib/labels";
import { Panel, Button, Field, Input, Select, Textarea, Callout, EmptyState, Toggle } from "@/components/ui";
import { money, percent, dateLabel } from "@/lib/format";
import { cn } from "@/lib/util";

const KINDS: ApprovalKind[] = ["readiness-conversation", "prequalification", "preapproval", "fully-underwritten"];

const KIND_TONE: Record<ApprovalKind, string> = {
  "readiness-conversation": "bg-surface-muted text-ink-subtle",
  prequalification: "bg-accent-soft text-accent",
  preapproval: "bg-positive/12 text-positive",
  "fully-underwritten": "bg-positive/15 text-positive",
};

/**
 * Mortgage approvals, typed by level so a casual "you're fine" conversation is
 * never mistaken for an underwritten approval. Our own guardrails always
 * outrank whatever a lender approves.
 */
export function ApprovalsTab() {
  const approvals = useApprovals();
  const [showAdd, setShowAdd] = useState(false);

  if (!approvals) return <div className="text-ink-subtle">Loading…</div>;

  return (
    <div>
      <Callout tone="caution" className="mb-5">
        A preapproval is not a guaranteed loan, and a preapproval amount is not our spending budget. Our own
        guardrails stay in control even when a lender approves more. Confirm the property-tax and insurance
        assumptions the lender used, and remember we are never committed to the lender that issued it.
      </Callout>

      <div className="mb-5 flex justify-end">
        <Button onClick={() => setShowAdd((s) => !s)}>{showAdd ? "Close" : "Add approval"}</Button>
      </div>

      {showAdd && <AddApprovalForm onDone={() => setShowAdd(false)} />}

      {approvals.length === 0 ? (
        <EmptyState
          title="No approvals recorded"
          description="Track each level separately: an early readiness conversation, a prequalification, a formal preapproval, and a fully underwritten approval when available."
        />
      ) : (
        <div className="space-y-3">
          {approvals
            .slice()
            .sort((a, b) => KINDS.indexOf(b.kind) - KINDS.indexOf(a.kind) || a.lender.localeCompare(b.lender))
            .map((a) => (
              <ApprovalCard key={a.id} approval={a} />
            ))}
        </div>
      )}
    </div>
  );
}

function ApprovalCard({ approval: a }: { approval: MortgageApproval }) {
  const [open, setOpen] = useState(false);
  const set = (patch: Partial<MortgageApproval>) => void updateApproval(a.id, patch);

  const reviews: [keyof MortgageApproval, string][] = [
    ["creditReviewed", "Credit"],
    ["incomeReviewed", "Income"],
    ["attendingContractReviewed", "Attending contract"],
    ["assetsReviewed", "Assets"],
    ["debtsReviewed", "Debts"],
    ["downPaymentVerified", "Down payment"],
  ];

  return (
    <Panel className="p-4">
      <div className="flex items-start justify-between gap-3">
        <button type="button" onClick={() => setOpen((o) => !o)} className="min-w-0 text-left">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium text-ink">{a.lender}</span>
            <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", KIND_TONE[a.kind])}>
              {APPROVAL_KIND_LABELS[a.kind]}
            </span>
          </div>
          <div className="text-sm text-ink-subtle">
            {a.maxLoanAmount ? `${money(a.maxLoanAmount)} max loan` : "amount not recorded"}
            {a.estimatedRatePct ? ` · ${percent(a.estimatedRatePct, 3)}` : ""}
            {a.expiresDate ? ` · expires ${dateLabel(a.expiresDate)}` : ""}
          </div>
        </button>
        <button onClick={() => setOpen((o) => !o)} className="shrink-0 text-xs text-ink-subtle hover:text-ink">
          {open ? "Less" : "Edit"}
        </button>
      </div>

      {open && (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Lender">
              <Input defaultValue={a.lender} onBlur={(e) => set({ lender: e.target.value })} />
            </Field>
            <Field label="Level" hint={APPROVAL_KIND_HINTS[a.kind]}>
              <Select value={a.kind} onChange={(e) => set({ kind: e.target.value as ApprovalKind })}>
                {KINDS.map((k) => (
                  <option key={k} value={k}>
                    {APPROVAL_KIND_LABELS[k]}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Issued date">
              <Input type="date" value={a.issuedDate ?? ""} onChange={(e) => set({ issuedDate: e.target.value || null })} />
            </Field>
            <Field label="Expires / refresh date">
              <Input type="date" value={a.expiresDate ?? ""} onChange={(e) => set({ expiresDate: e.target.value || null })} />
            </Field>
            <Field label="Max loan amount">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={a.maxLoanAmount ?? ""}
                onBlur={(e) => set({ maxLoanAmount: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Max purchase price">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={a.maxPurchasePrice ?? ""}
                onBlur={(e) => set({ maxPurchasePrice: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Estimated rate (%)">
              <Input
                type="number"
                step="0.001"
                defaultValue={a.estimatedRatePct ?? ""}
                onBlur={(e) => set({ estimatedRatePct: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Estimated closing costs">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={a.estimatedClosingCosts ?? ""}
                onBlur={(e) => set({ estimatedClosingCosts: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Assumed annual taxes" hint="Confirm this — NJ taxes vary widely.">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={a.assumedAnnualTaxes ?? ""}
                onBlur={(e) => set({ assumedAnnualTaxes: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
            <Field label="Assumed annual insurance">
              <Input
                type="number"
                inputMode="numeric"
                defaultValue={a.assumedAnnualInsurance ?? ""}
                onBlur={(e) => set({ assumedAnnualInsurance: e.target.value === "" ? null : Number(e.target.value) })}
              />
            </Field>
          </div>

          <div>
            <span className="mb-2 block text-sm font-medium text-ink">What the lender reviewed</span>
            <div className="flex flex-wrap gap-4">
              {reviews.map(([key, label]) => (
                <Toggle
                  key={String(key)}
                  checked={Boolean(a[key])}
                  onChange={(v) => set({ [key]: v } as Partial<MortgageApproval>)}
                  label={label}
                />
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Reserve requirement">
              <Input defaultValue={a.reserveRequirement} onBlur={(e) => set({ reserveRequirement: e.target.value })} />
            </Field>
            <Field label="Property-type restrictions">
              <Input defaultValue={a.propertyTypeRestrictions} onBlur={(e) => set({ propertyTypeRestrictions: e.target.value })} />
            </Field>
          </div>
          <Field label="Loan-limit / county notes">
            <Input defaultValue={a.loanLimitNotes} onBlur={(e) => set({ loanLimitNotes: e.target.value })} />
          </Field>
          <Field label="Notes">
            <Textarea rows={2} defaultValue={a.notes} onBlur={(e) => set({ notes: e.target.value })} />
          </Field>

          <div className="flex justify-end">
            <Button
              variant="danger"
              size="sm"
              onClick={() => {
                if (confirm(`Delete the ${APPROVAL_KIND_LABELS[a.kind]} from ${a.lender}?`)) void deleteApproval(a.id);
              }}
            >
              Delete
            </Button>
          </div>
        </div>
      )}
    </Panel>
  );
}

function AddApprovalForm({ onDone }: { onDone: () => void }) {
  const [lender, setLender] = useState("");
  const [kind, setKind] = useState<ApprovalKind>("readiness-conversation");

  const submit = async () => {
    if (!lender.trim()) return;
    await createApproval({ lender: lender.trim(), kind });
    onDone();
  };

  return (
    <Panel className="mb-5 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Lender">
          <Input value={lender} onChange={(e) => setLender(e.target.value)} autoFocus />
        </Field>
        <Field label="Level" hint={APPROVAL_KIND_HINTS[kind]}>
          <Select value={kind} onChange={(e) => setKind(e.target.value as ApprovalKind)}>
            {KINDS.map((k) => (
              <option key={k} value={k}>
                {APPROVAL_KIND_LABELS[k]}
              </option>
            ))}
          </Select>
        </Field>
      </div>
      <div className="mt-3 flex gap-2">
        <Button onClick={submit}>Add approval</Button>
        <Button variant="secondary" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </Panel>
  );
}
