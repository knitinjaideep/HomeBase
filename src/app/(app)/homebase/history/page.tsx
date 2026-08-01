"use client";

import Link from "next/link";
import { useOwnedHome, useProperty, useVisitsForProperty, useDealForProperty } from "@/lib/hooks";
import { dateLabel, money } from "@/lib/format";
import { PROPERTY_STATUS_LABELS } from "@/lib/labels";
import { Panel, SectionTitle, EmptyState } from "@/components/ui";
import { NoteContextPanel } from "@/components/notes/note-context-panel";

/**
 * A read-only look back at the buying journey for whichever property was
 * converted into the current HomeBase home (`ownedHome.sourcePropertyId`).
 * Deliberately kept under /homebase rather than linking into the buyer-only
 * `/properties/:id` route — a homeowner-mode workspace is redirected away
 * from that prefix (see lib/workspace/navigation.ts), so this page renders
 * everything it needs directly instead of pointing there.
 */
export default function BuyingJourneyHistoryPage() {
  const home = useOwnedHome();
  const property = useProperty(home?.sourcePropertyId ?? undefined);
  const visits = useVisitsForProperty(home?.sourcePropertyId ?? undefined);
  const deal = useDealForProperty(home?.sourcePropertyId ?? undefined);

  if (home === undefined || property === undefined) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  return (
    <div>
      <div className="mb-6">
        <Link href="/homebase" className="text-sm text-mode-accent hover:underline">
          ← HomeBase
        </Link>
        <h1 className="mt-2 font-display text-2xl text-ink sm:text-3xl">Buying journey</h1>
        <p className="mt-2 max-w-2xl text-sm text-ink-muted">
          A read-only look back at how you found and bought this home. Nothing here can be edited.
        </p>
      </div>

      {!home?.sourcePropertyId || !property ? (
        <EmptyState
          title="No buying journey linked"
          description="This home wasn't converted from a candidate home tracked in HomeScope, so there's no buying history to show."
        />
      ) : (
        <div className="space-y-6">
          <Panel className="p-5">
            <SectionTitle title="The home you bought" className="mb-3" />
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              <Row label="Address" value={property.address} />
              <Row label="Town" value={property.town || "—"} />
              <Row label="Status" value={PROPERTY_STATUS_LABELS[property.status]} />
              <Row label="Listing" value={property.listingUrl || "—"} />
              <Row label="Date added to HomeScope" value={dateLabel(property.dateAdded)} />
              <Row label="Asking price" value={money(property.askingPrice)} />
              <Row label="Offer price" value={money(property.offerPrice)} />
              <Row label="Final sale price" value={money(property.finalSalePrice)} />
            </dl>
          </Panel>

          <Panel className="p-5">
            <SectionTitle title={`Visits · ${(visits ?? []).length}`} className="mb-3" />
            {(visits ?? []).length === 0 ? (
              <p className="text-sm text-ink-subtle">No visits were recorded.</p>
            ) : (
              <ul className="space-y-2 text-sm text-ink-muted">
                {(visits ?? []).map((v) => (
                  <li key={v.id}>
                    Visited {dateLabel(v.visitDate)}
                    {v.stillWantAfterExcitement ? ` — "${v.stillWantAfterExcitement.slice(0, 80)}"` : ""}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          {deal && (
            <Panel className="p-5">
              <SectionTitle title="Offer & closing" className="mb-3" />
              <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
                <Row label="Initial offer" value={money(deal.offer.initialOfferPrice)} />
                <Row label="Final accepted terms" value={deal.offer.finalAcceptedTerms || "—"} />
                <Row label="Inspections completed" value={String(deal.inspections.length)} />
                <Row label="Attorney approved" value={deal.attorneyReview.attorneyApproved ? "Yes" : "No"} />
                <Row label="Closing date" value={deal.postClosing.closingDate ? dateLabel(deal.postClosing.closingDate) : "—"} />
                <Row label="Keys received" value={deal.postClosing.keysReceived ? "Yes" : "No"} />
              </dl>
            </Panel>
          )}

          <NoteContextPanel contextType="property" contextId={property.id} title="Notes from your buying journey" />
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <dt className="text-ink-muted">{label}</dt>
      <dd className="text-right text-ink">{value}</dd>
    </div>
  );
}
