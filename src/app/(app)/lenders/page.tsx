"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLenderQuotes } from "@/lib/hooks";
import { estimateForQuote } from "@/lib/lender-estimate";
import { money, percent, dateLabel } from "@/lib/format";
import { Button, Callout, EmptyState, PageHeader } from "@/components/ui";
import { Overlay } from "@/components/modal";
import { LenderQuoteForm } from "@/components/lender/lender-quote-form";
import { ApprovalsTab } from "@/components/lender/approvals";
import { LOAN_TYPE_LABELS } from "@/lib/labels";
import type { LenderQuote } from "@/lib/models";
import { cn } from "@/lib/util";

function triLabel(v: boolean | null): string {
  if (v === null) return "—";
  return v ? "Yes" : "No";
}

type LenderTab = "quotes" | "approvals";

export default function LendersPage() {
  const quotes = useLenderQuotes();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<LenderTab>((searchParams.get("tab") as LenderTab | null) ?? "quotes");
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<LenderQuote | null>(null);

  if (!quotes) return <div className="text-ink-subtle">Loading…</div>;

  return (
    <div>
      <PageHeader
        title="Lenders"
        description="Compare lender quotes, and track each approval by its true level."
        actions={tab === "quotes" ? <Button onClick={() => setAdding(true)}>Add quote</Button> : undefined}
      />

      <div className="mb-6 inline-flex overflow-hidden rounded-lg border border-line">
        {(["quotes", "approvals"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "px-4 py-2 text-sm font-medium capitalize",
              tab === t ? "bg-accent text-white" : "bg-surface text-ink-muted hover:bg-surface-muted",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "approvals" ? (
        <ApprovalsTab />
      ) : quotes.length === 0 ? (
        <EmptyState
          title="No quotes yet"
          description="Add physician, conventional, high-balance, and jumbo quotes as you gather them to compare the real numbers."
          action={<Button onClick={() => setAdding(true)}>Add quote</Button>}
        />
      ) : (
        <>
          <div className="hs-scroll overflow-x-auto rounded-xl border border-line">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-surface-muted text-left text-ink-muted">
                  <Th>Lender</Th>
                  <Th>Type</Th>
                  <Th right>Rate</Th>
                  <Th right>APR</Th>
                  <Th right>Est. P&I</Th>
                  <Th right>Cash required</Th>
                  <Th right>Upfront cost</Th>
                  <Th right>5-yr interest</Th>
                  <Th right>5-yr total</Th>
                  <Th right>PMI</Th>
                  <Th></Th>
                </tr>
              </thead>
              <tbody>
                {quotes.map((q) => {
                  const est = estimateForQuote(q);
                  return (
                    <tr key={q.id} className="border-t border-line align-top">
                      <Td>
                        <div className="font-medium text-ink">{q.lender}</div>
                        <div className="text-xs text-ink-subtle">
                          {q.contact || "—"}
                          {q.quoteDate ? ` · ${dateLabel(q.quoteDate)}` : ""}
                        </div>
                        <div className="text-xs text-ink-subtle">
                          {q.rateType === "adjustable" ? "Adjustable" : "Fixed"}
                          {q.rateLockDays ? ` · ${q.rateLockDays}-day lock` : ""}
                        </div>
                      </Td>
                      <Td>{LOAN_TYPE_LABELS[q.loanType]}</Td>
                      <Td right>{percent(q.interestRatePct, 3)}</Td>
                      <Td right>{percent(q.aprPct, 3)}</Td>
                      <Td right>{`${money(est.monthlyPrincipalAndInterest)}/mo`}</Td>
                      <Td right>{money(est.cashRequired)}</Td>
                      <Td right>{money(est.upfrontLenderCost)}</Td>
                      <Td right>{money(est.fiveYearInterest)}</Td>
                      <Td right>{money(est.fiveYearTotalFinancingCost)}</Td>
                      <Td right>{triLabel(q.hasPmi)}</Td>
                      <Td>
                        <button
                          onClick={() => setEditing(q)}
                          className="text-accent hover:underline"
                        >
                          Edit
                        </button>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <Callout tone="neutral" className="mt-4">
            Est. P&amp;I is principal and interest only — taxes, insurance, and HOA are property-specific.
            Five-year figures use a standard amortization schedule. Confirm every number in a written
            Loan Estimate. All values here are estimates.
          </Callout>
        </>
      )}

      <Overlay open={adding} onClose={() => setAdding(false)} title="Add lender quote" variant="drawer">
        <LenderQuoteForm onDone={() => setAdding(false)} />
      </Overlay>
      <Overlay
        open={editing !== null}
        onClose={() => setEditing(null)}
        title="Edit lender quote"
        variant="drawer"
      >
        {editing && <LenderQuoteForm quote={editing} onDone={() => setEditing(null)} />}
      </Overlay>
    </div>
  );
}

function Th({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <th className={`whitespace-nowrap p-3 font-medium ${right ? "text-right" : "text-left"}`}>
      {children}
    </th>
  );
}

function Td({ children, right }: { children?: React.ReactNode; right?: boolean }) {
  return (
    <td className={`whitespace-nowrap p-3 ${right ? "text-right text-ink" : "text-ink"}`}>
      {children}
    </td>
  );
}
