"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useAllVisits, useFinancial, useHousehold, useProperties } from "@/lib/hooks";
import { evaluateProperty, type PropertyEvaluation } from "@/lib/property-finance";
import { money, num, rating } from "@/lib/format";
import { BandPill, Button, Callout, EmptyState, PageHeader, Panel, RatingDots } from "@/components/ui";
import type { Property, PropertyVisit } from "@/lib/models";
import { cn } from "@/lib/util";

const SELECTION_KEY = "homescope:compare-selection";
const NOTES_KEY = "homescope:compare-notes";
const MAX = 5;

interface Row {
  label: string;
  /** Numeric value used to highlight the most favorable cell, or null. */
  raw: (d: Datum) => number | null;
  display: (d: Datum) => React.ReactNode;
  better?: "min" | "max";
}

interface Datum {
  property: Property;
  evaluation: PropertyEvaluation;
  visit: PropertyVisit | undefined;
}

export default function ComparePage() {
  const properties = useProperties();
  const financial = useFinancial();
  const household = useHousehold();
  const visits = useAllVisits();

  const [selected, setSelected] = useState<string[]>([]);
  const [notes, setNotes] = useState("");

  useEffect(() => {
    try {
      const s = localStorage.getItem(SELECTION_KEY);
      if (s) setSelected(JSON.parse(s));
      const n = localStorage.getItem(NOTES_KEY);
      if (n) setNotes(n);
    } catch {
      /* ignore */
    }
  }, []);

  const persistSelection = (next: string[]) => {
    setSelected(next);
    try {
      localStorage.setItem(SELECTION_KEY, JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const latestVisitByProperty = useMemo(() => {
    const map = new Map<string, PropertyVisit>();
    (visits ?? []).forEach((v) => {
      const existing = map.get(v.propertyId);
      if (!existing || v.visitDate > existing.visitDate) map.set(v.propertyId, v);
    });
    return map;
  }, [visits]);

  if (!properties || !financial || !household || !visits) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const active = properties.filter((p) => !p.isArchived);
  const chosen = selected
    .map((id) => active.find((p) => p.id === id))
    .filter((p): p is Property => Boolean(p));

  const data: Datum[] = chosen.map((property) => ({
    property,
    evaluation: evaluateProperty(property, financial, household),
    visit: latestVisitByProperty.get(property.id),
  }));

  const toggle = (id: string) => {
    if (selected.includes(id)) {
      persistSelection(selected.filter((x) => x !== id));
    } else if (selected.length < MAX) {
      persistSelection([...selected, id]);
    }
  };

  const rows = buildRows(household.buyer1Name, household.buyer2Name);

  return (
    <div>
      <PageHeader
        title="Compare"
        description="Two to five homes, side by side. The best figure in each row is marked."
        actions={
          data.length >= 2 ? (
            <Button variant="secondary" onClick={() => window.print()}>
              Print comparison
            </Button>
          ) : undefined
        }
      />

      {/* Picker */}
      <Panel className="no-print mb-6 p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg text-ink">Choose properties</h2>
          <span className="text-sm text-ink-subtle">
            {selected.length}/{MAX} selected
          </span>
        </div>
        {active.length === 0 ? (
          <p className="text-sm text-ink-muted">Add some properties first.</p>
        ) : (
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((p) => {
              const isSelected = selected.includes(p.id);
              const disabled = !isSelected && selected.length >= MAX;
              return (
                <label
                  key={p.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-2.5 rounded-lg border p-3 text-sm",
                    isSelected ? "border-accent bg-accent-soft" : "border-line bg-surface",
                    disabled && "cursor-not-allowed opacity-50",
                  )}
                >
                  <input
                    type="checkbox"
                    className="mt-0.5"
                    checked={isSelected}
                    disabled={disabled}
                    onChange={() => toggle(p.id)}
                  />
                  <span>
                    <span className="block font-medium text-ink">{p.address}</span>
                    <span className="block text-xs text-ink-subtle">
                      {p.town || "—"} · {money(p.askingPrice)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
        )}
      </Panel>

      {data.length < 2 ? (
        <EmptyState
          title="Select at least two properties"
          description="Pick two to five homes above to see them compared line by line."
        />
      ) : (
        <>
          {/* Print header */}
          <div className="mb-4 hidden print-block print:block">
            <h1 className="font-display text-2xl">HomeScope — Comparison</h1>
            <p className="text-sm">Personal planning estimate. Not financial, legal, or tax advice.</p>
          </div>

          <div className="hs-scroll overflow-x-auto rounded-xl border border-line print-block">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr>
                  <th className="sticky left-0 z-10 min-w-[10rem] border-b border-line bg-surface-muted p-3 text-left font-medium text-ink-muted">
                    Property
                  </th>
                  {data.map((d) => (
                    <th
                      key={d.property.id}
                      className="min-w-[11rem] border-b border-l border-line bg-surface-muted p-3 text-left align-top"
                    >
                      <Link
                        href={`/properties/${d.property.id}`}
                        className="font-display text-base text-ink hover:text-accent"
                      >
                        {d.property.address}
                      </Link>
                      <div className="mt-1 text-xs text-ink-subtle">{d.property.town || "—"}</div>
                      <div className="mt-2">
                        <BandPill band={d.evaluation.overallBand} />
                      </div>
                      <button
                        onClick={() => toggle(d.property.id)}
                        className="no-print mt-2 text-xs text-ink-muted hover:text-critical"
                      >
                        Remove
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const best = bestIndex(row, data);
                  return (
                    <tr key={row.label} className="even:bg-surface-muted/40">
                      <th className="sticky left-0 z-10 border-b border-line bg-inherit p-3 text-left font-medium text-ink-muted">
                        {row.label}
                      </th>
                      {data.map((d, i) => (
                        <td
                          key={d.property.id}
                          className={cn(
                            "border-b border-l border-line p-3 text-ink",
                            best === i && "font-semibold text-accent",
                          )}
                        >
                          {row.display(d)}
                          {best === i && data.length > 1 && (
                            <span className="ml-1.5 text-[10px] text-accent" title="Most favorable">
                              ●
                            </span>
                          )}
                        </td>
                      ))}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Preference notes */}
          <Panel className="mt-6 p-5 print-block">
            <h2 className="mb-2 font-display text-lg text-ink">Why we prefer one over another</h2>
            <textarea
              rows={4}
              className="hs-input"
              placeholder="Notes on the tradeoffs — the numbers don't decide this."
              value={notes}
              onChange={(e) => {
                setNotes(e.target.value);
                try {
                  localStorage.setItem(NOTES_KEY, e.target.value);
                } catch {
                  /* ignore */
                }
              }}
            />
          </Panel>

          <Callout tone="neutral" className="mt-4">
            The marked cell is only the most favorable single figure in that row. Weigh schools,
            commute, and how each home feels — not just the estimates.
          </Callout>
        </>
      )}
    </div>
  );
}

function bestIndex(row: Row, data: Datum[]): number | null {
  if (!row.better) return null;
  let bestIdx: number | null = null;
  let bestVal: number | null = null;
  data.forEach((d, i) => {
    const v = row.raw(d);
    if (v === null || Number.isNaN(v)) return;
    if (bestVal === null || (row.better === "min" ? v < bestVal : v > bestVal)) {
      bestVal = v;
      bestIdx = i;
    }
  });
  return bestIdx;
}

function buildRows(buyer1: string, buyer2: string): Row[] {
  const ratingRow = (label: string, key: keyof Property["ratings"]): Row => ({
    label,
    raw: (d) => d.property.ratings[key],
    display: (d) => <RatingDots value={d.property.ratings[key]} />,
    better: "max",
  });

  return [
    { label: "Asking price", raw: (d) => d.property.askingPrice, display: (d) => money(d.property.askingPrice), better: "min" },
    { label: "Planned offer price", raw: (d) => d.property.offerPrice, display: (d) => money(d.property.offerPrice), better: "min" },
    { label: "Est. cash at closing", raw: (d) => d.evaluation.plan.cashRequiredAtClosing, display: (d) => money(d.evaluation.plan.cashRequiredAtClosing), better: "min" },
    { label: "Est. lender-style payment", raw: (d) => d.evaluation.plan.lender.total, display: (d) => `${money(d.evaluation.plan.lender.total)}/mo`, better: "min" },
    { label: "Est. real monthly cost", raw: (d) => d.evaluation.plan.realMonthlyOwnershipCost, display: (d) => `${money(d.evaluation.plan.realMonthlyOwnershipCost)}/mo`, better: "min" },
    { label: "Property taxes / yr", raw: (d) => d.property.annualPropertyTaxes, display: (d) => money(d.property.annualPropertyTaxes), better: "min" },
    { label: "Maintenance / mo", raw: (d) => d.evaluation.plan.maintenanceMonthly, display: (d) => `${money(d.evaluation.plan.maintenanceMonthly)}/mo`, better: "min" },
    { label: "Immediate renovation", raw: (d) => d.property.finance.immediateRenovationEstimate, display: (d) => money(d.property.finance.immediateRenovationEstimate), better: "min" },
    { label: "Cash remaining after closing", raw: (d) => d.evaluation.plan.cashRemainingAfterClosing, display: (d) => money(d.evaluation.plan.cashRemainingAfterClosing), better: "max" },
    { label: "Door-to-door commute", raw: (d) => d.property.doorToDoorCommuteMinutes, display: (d) => (d.property.doorToDoorCommuteMinutes ? `${d.property.doorToDoorCommuteMinutes} min` : "—"), better: "min" },
    { label: "Bedrooms", raw: (d) => d.property.bedrooms, display: (d) => num(d.property.bedrooms), better: "max" },
    { label: "Bathrooms", raw: (d) => d.property.bathrooms, display: (d) => num(d.property.bathrooms), better: "max" },
    ratingRow("School confidence", "schoolConfidence"),
    ratingRow("Commute", "commute"),
    ratingRow("Station convenience", "stationConvenience"),
    ratingRow("Backyard", "backyard"),
    ratingRow("Primary bedroom", "primaryBedroom"),
    ratingRow("Closet", "closet"),
    ratingRow("Layout", "layout"),
    ratingRow("Condition", "condition"),
    ratingRow("Neighborhood", "neighborhood"),
    ratingRow("Resale confidence", "resaleConfidence"),
    {
      label: `${buyer1} excitement (last visit)`,
      raw: (d) => d.visit?.buyer1Review.emotionalExcitement ?? null,
      display: (d) => <RatingDots value={d.visit?.buyer1Review.emotionalExcitement ?? null} />,
      better: "max",
    },
    {
      label: `${buyer2} excitement (last visit)`,
      raw: (d) => d.visit?.buyer2Review.emotionalExcitement ?? null,
      display: (d) => <RatingDots value={d.visit?.buyer2Review.emotionalExcitement ?? null} />,
      better: "max",
    },
    {
      label: "Overall score",
      raw: (d) => d.evaluation.score,
      display: (d) => rating(d.evaluation.score),
      better: "max",
    },
  ];
}
