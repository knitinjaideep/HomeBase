"use client";

import { useEffect, useMemo, useState } from "react";
import { useFinancial, useHousehold, useProperties } from "@/lib/hooks";
import { evaluateProperty } from "@/lib/property-finance";
import type { Property, PropertyStatus } from "@/lib/models";
import { Button, EmptyState, Input, Select } from "@/components/ui";
import { Overlay } from "@/components/modal";
import { PropertyCard } from "@/components/property/property-card";
import { PropertyForm } from "@/components/property/property-form";
import { propertyMatchesSearch } from "@/lib/property-search";
import { cn } from "@/lib/util";

type SortOption = "newest" | "oldest" | "price-asc" | "price-desc" | "score-desc";

const SORT_LABELS: Record<SortOption, string> = {
  newest: "Newest",
  oldest: "Oldest",
  "price-asc": "Price: low to high",
  "price-desc": "Price: high to low",
  "score-desc": "Best fit",
};

interface FilterPill {
  key: string;
  label: string;
  statuses: PropertyStatus[] | null;
}

const FILTERS: FilterPill[] = [
  { key: "all", label: "All", statuses: null },
  { key: "saved", label: "Saved", statuses: ["saved", "researching"] },
  { key: "touring", label: "Touring", statuses: ["tour-scheduled", "visited", "interested"] },
  { key: "shortlist", label: "Shortlist", statuses: ["shortlisted"] },
  { key: "offer", label: "Offer", statuses: ["possible-offer", "offer-submitted", "under-contract"] },
];

export default function PropertiesPage() {
  const properties = useProperties();
  const financial = useFinancial();
  const household = useHousehold();

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<string>("all");
  const [showArchived, setShowArchived] = useState(false);
  const [sort, setSort] = useState<SortOption>("newest");
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("add") === "1") setAdding(true);
  }, []);

  const visible = useMemo(() => {
    if (!properties || !financial || !household) return [];
    const activeFilter = FILTERS.find((f) => f.key === filter);

    const withEval = properties
      .filter((p) => (showArchived ? p.isArchived : !p.isArchived))
      .filter((p) => (activeFilter?.statuses ? activeFilter.statuses.includes(p.status) : true))
      .filter((p) => propertyMatchesSearch(p, search))
      .map((p) => ({ p, e: evaluateProperty(p, financial, household) }));

    const value = (item: { p: Property; e: ReturnType<typeof evaluateProperty> }): number | null => {
      switch (sort) {
        case "price-asc":
        case "price-desc":
          return item.e.price;
        case "score-desc":
          return item.e.score;
        case "oldest":
        case "newest":
        default:
          return new Date(item.p.dateAdded).getTime();
      }
    };

    const desc = sort === "price-desc" || sort === "score-desc" || sort === "newest";
    return withEval.sort((a, b) => {
      const av = value(a);
      const bv = value(b);
      if (av === null && bv === null) return 0;
      if (av === null) return 1;
      if (bv === null) return -1;
      return desc ? bv - av : av - bv;
    });
  }, [properties, financial, household, search, filter, showArchived, sort]);

  if (!properties || !financial || !household) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  const archivedCount = properties.filter((p) => p.isArchived).length;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between gap-4">
        <h1 className="font-display text-2xl text-ink sm:text-3xl">Homes</h1>
        <Button onClick={() => setAdding(true)}>Add home</Button>
      </div>

      <div className="mb-5 flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
                filter === f.key
                  ? "bg-accent text-white"
                  : "bg-surface-muted text-ink-muted hover:text-ink",
              )}
            >
              {f.label}
            </button>
          ))}
          {archivedCount > 0 && (
            <button
              onClick={() => setShowArchived((v) => !v)}
              className={cn(
                "ml-auto rounded-full px-3.5 py-1.5 text-xs font-medium",
                showArchived ? "bg-surface-muted text-ink" : "text-ink-subtle hover:text-ink",
              )}
            >
              {showArchived ? "Showing archived" : `Archived (${archivedCount})`}
            </button>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Input
            placeholder="Search address or town…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search homes"
            className="max-w-xs"
          />
          <Select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortOption)}
            aria-label="Sort by"
            className="w-auto"
          >
            {(Object.keys(SORT_LABELS) as SortOption[]).map((k) => (
              <option key={k} value={k}>
                {SORT_LABELS[k]}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {visible.length === 0 ? (
        <EmptyState
          title={showArchived ? "No archived homes" : "No homes yet"}
          description={
            showArchived
              ? "Archived homes will appear here."
              : "When you're ready, save the first property you're considering."
          }
          action={!showArchived ? <Button onClick={() => setAdding(true)}>Add home</Button> : undefined}
        />
      ) : (
        <div className="divide-y divide-line rounded-xl border border-line bg-surface">
          {visible.map(({ p, e }) => (
            <PropertyCard key={p.id} property={p} evaluation={e} />
          ))}
        </div>
      )}

      <Overlay open={adding} onClose={() => setAdding(false)} title="Add home" variant="drawer">
        <PropertyForm onDone={() => setAdding(false)} />
      </Overlay>
    </div>
  );
}
