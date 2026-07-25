"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useHousehold, useProperty, useVisitsForProperty } from "@/lib/hooks";
import { newVisit } from "@/lib/repo";
import { dateLabel } from "@/lib/format";
import { Button } from "@/components/ui";
import { VisitForm } from "@/components/visit/visit-form";
import type { PropertyVisit } from "@/lib/models";

export default function VisitPage() {
  const params = useParams<{ id: string }>();
  const property = useProperty(params.id);
  const household = useHousehold();
  const visits = useVisitsForProperty(params.id);

  const [current, setCurrent] = useState<PropertyVisit | null>(null);

  useEffect(() => {
    if (!visits || current) return;
    setCurrent(visits.length ? visits[visits.length - 1] : newVisit(params.id));
  }, [visits, current, params.id]);

  if (property === undefined || !household || !visits || !current) {
    return <div className="text-ink-subtle">Loading…</div>;
  }
  if (property === null) {
    return (
      <div>
        <Link href="/properties" className="text-sm text-accent hover:underline">
          ← Properties
        </Link>
        <p className="mt-6 text-ink-muted">This property could not be found.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-4">
        <Link href={`/properties/${property.id}`} className="text-sm text-accent hover:underline">
          ← {property.address}
        </Link>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-3xl text-ink">Visit notes</h1>
          <p className="mt-1 text-ink-muted">
            {property.address}
            {property.town ? ` · ${property.town}` : ""}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {visits.length > 0 && (
            <select
              className="hs-input w-auto"
              value={visits.some((v) => v.id === current.id) ? current.id : "draft"}
              onChange={(e) => {
                const v = visits.find((x) => x.id === e.target.value);
                if (v) setCurrent(v);
              }}
              aria-label="Choose a visit"
            >
              {!visits.some((v) => v.id === current.id) && (
                <option value="draft">New visit (unsaved)</option>
              )}
              {visits.map((v) => (
                <option key={v.id} value={v.id}>
                  {dateLabel(v.visitDate)}
                </option>
              ))}
            </select>
          )}
          <Button variant="secondary" onClick={() => setCurrent(newVisit(property.id))}>
            New visit
          </Button>
        </div>
      </div>

      <VisitForm
        key={current.id}
        visit={current}
        buyer1Name={household.buyer1Name}
        buyer2Name={household.buyer2Name}
        onSaved={() => {
          /* live query refreshes the list; keep editing the current visit */
        }}
      />
    </div>
  );
}
