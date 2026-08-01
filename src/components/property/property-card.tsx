"use client";

import Link from "next/link";
import type { Property } from "@/lib/models";
import type { PropertyEvaluation } from "@/lib/property-finance";
import { money } from "@/lib/format";
import { Chip } from "@/components/ui";
import { PROPERTY_STATUS_LABELS } from "@/lib/labels";
import { cn } from "@/lib/util";

const TOURING_STATUSES: Property["status"][] = [
  "tour-scheduled",
  "visited",
  "interested",
  "shortlisted",
  "possible-offer",
];

const SETTLED_STATUSES: Property["status"][] = ["rejected", "eliminated", "archived"];

/** One row in the Homes list: address, town, price, status — nothing more. */
export function PropertyCard({
  property,
  evaluation,
}: {
  property: Property;
  evaluation: PropertyEvaluation;
}) {
  const showVisitLink = TOURING_STATUSES.includes(property.status);
  const settled = SETTLED_STATUSES.includes(property.status);
  const purchased = property.status === "purchased";

  return (
    <div className="group relative flex items-center gap-4 px-4 py-3.5 hover:bg-surface-muted sm:px-5">
      <Link href={`/properties/${property.id}`} className="absolute inset-0" aria-label={property.address} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="truncate font-medium text-ink">{property.address}</span>
          {property.isSample && <Chip tone="sample">Sample</Chip>}
        </div>
        <div className="mt-0.5 truncate text-sm text-ink-subtle">{property.town || "—"}</div>
      </div>

      <div className="flex shrink-0 flex-col items-end gap-0.5">
        <span className="font-medium text-ink">{money(evaluation.price)}</span>
        {evaluation.hasPrice && (
          <span className="text-xs text-ink-subtle">{money(evaluation.plan.lender.total)}/mo</span>
        )}
      </div>

      <span
        className={cn(
          "shrink-0 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-medium",
          purchased
            ? "bg-positive/12 text-positive"
            : settled
              ? "bg-surface-muted text-ink-subtle"
              : "bg-accent-soft text-accent",
        )}
      >
        {PROPERTY_STATUS_LABELS[property.status]}
      </span>

      {showVisitLink && (
        <Link
          href={`/visit/${property.id}`}
          className="relative z-10 hidden shrink-0 text-sm font-medium text-accent hover:underline sm:inline"
        >
          Visit →
        </Link>
      )}
    </div>
  );
}
