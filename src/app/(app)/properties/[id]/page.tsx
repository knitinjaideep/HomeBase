"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useState } from "react";
import {
  useDealForProperty,
  useFinancial,
  useHousehold,
  useProperty,
  useVisitsForProperty,
} from "@/lib/hooks";
import { archiveProperty, deleteProperty, restoreProperty, updateProperty } from "@/lib/repo";
import { evaluateProperty } from "@/lib/property-finance";
import { DealSection } from "@/components/property/deal-section";
import { NoteContextPanel } from "@/components/notes/note-context-panel";
import { dateLabel, money, moneyPerMonth, num, percent } from "@/lib/format";
import {
  BandPill,
  Callout,
  Chip,
  GuardrailNote,
  Panel,
  RatingDots,
} from "@/components/ui";
import { Overlay, ConfirmDialog } from "@/components/modal";
import { PropertyForm } from "@/components/property/property-form";
import { ConvertToHomeownerDialog } from "@/components/property/convert-to-homeowner-dialog";
import { useToast } from "@/components/toast";
import {
  PARKING_LABELS,
  PROPERTY_STATUS_LABELS,
  PROPERTY_TYPE_LABELS,
  TRAFFIC_LABELS,
} from "@/lib/labels";
import { cn } from "@/lib/util";
import type { Property } from "@/lib/models";

const RATING_DISPLAY: { key: keyof Property["ratings"]; label: string }[] = [
  { key: "schoolConfidence", label: "School confidence" },
  { key: "commute", label: "Commute" },
  { key: "stationConvenience", label: "Station convenience" },
  { key: "neighborhood", label: "Neighborhood" },
  { key: "layout", label: "Layout" },
  { key: "condition", label: "Condition" },
  { key: "resaleConfidence", label: "Resale confidence" },
  { key: "backyard", label: "Backyard" },
  { key: "frontYard", label: "Front yard" },
  { key: "primaryBedroom", label: "Primary bedroom" },
  { key: "closet", label: "Primary closet" },
  { key: "kitchen", label: "Kitchen" },
  { key: "basement", label: "Basement" },
  { key: "garage", label: "Garage" },
  { key: "storage", label: "Storage" },
  { key: "naturalLight", label: "Natural light" },
  { key: "homeOffice", label: "Home office" },
  { key: "childSafety", label: "Child safety" },
];

const TABS = ["Overview", "Visit", "Money", "Research", "Notes"] as const;
type Tab = (typeof TABS)[number];

export default function PropertyDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { notify } = useToast();
  const property = useProperty(params.id);
  const financial = useFinancial();
  const household = useHousehold();
  const visits = useVisitsForProperty(params.id);
  const deal = useDealForProperty(params.id);

  const [tab, setTab] = useState<Tab>("Overview");
  const [editing, setEditing] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [converting, setConverting] = useState(false);

  if (property === undefined || !financial || !household) {
    return <div className="text-ink-subtle">Loading…</div>;
  }
  if (property === null) {
    return (
      <div>
        <Link href="/properties" className="text-sm text-accent hover:underline">
          ← Homes
        </Link>
        <p className="mt-6 text-ink-muted">This property could not be found.</p>
      </div>
    );
  }

  const e = evaluateProperty(property, financial, household);
  const { plan } = e;
  const isShortlisted = property.status === "shortlisted";
  const isPurchased = property.status === "purchased";
  const canConvert =
    !isPurchased &&
    (["possible-offer", "offer-submitted", "under-contract"].includes(property.status) ||
      Boolean(deal?.postClosing.closingCompleted));

  const handleDelete = async () => {
    await deleteProperty(property.id);
    notify("Property deleted");
    router.push("/properties");
  };

  const toggleShortlist = () =>
    void updateProperty(property.id, { status: isShortlisted ? "interested" : "shortlisted" });

  return (
    <div>
      <div className="no-print mb-4">
        <Link href="/properties" className="text-sm text-accent hover:underline">
          ← Homes
        </Link>
      </div>

      {/* Print-only header */}
      <div className="mb-6 hidden print-block print:block">
        <h1 className="font-display text-2xl">HomeScope — Property report</h1>
        <p className="text-sm">Personal planning estimate. Not financial, legal, or tax advice.</p>
      </div>

      {/* Address, price, status */}
      <div className="mb-4 flex flex-col gap-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-2xl text-ink sm:text-3xl">{property.address}</h1>
          {property.isSample && <Chip tone="sample">Sample</Chip>}
        </div>
        <p className="text-ink-muted">
          {property.town || "—"}
          {property.zip ? ` ${property.zip}` : ""} · {money(e.price)} · {PROPERTY_STATUS_LABELS[property.status]}
        </p>
        {property.listingUrl && (
          <a
            href={property.listingUrl}
            target="_blank"
            rel="noreferrer"
            className="no-print text-sm text-accent hover:underline"
          >
            Open listing ↗
          </a>
        )}
      </div>

      {/* Primary actions */}
      <div className="no-print mb-2 flex flex-wrap gap-2">
        <Link
          href={`/visit/${property.id}`}
          className="inline-flex min-h-[2.5rem] items-center rounded-lg bg-accent px-4 text-sm font-medium text-white hover:opacity-90"
        >
          Start visit
        </Link>
        <Link
          href="/compare"
          className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Compare
        </Link>
        <Link
          href="/finances"
          className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-line px-4 text-sm font-medium text-ink hover:bg-surface-muted"
        >
          Calculate
        </Link>
        <button
          onClick={toggleShortlist}
          className={cn(
            "inline-flex min-h-[2.5rem] items-center rounded-lg border px-4 text-sm font-medium",
            isShortlisted
              ? "border-positive/40 bg-positive/12 text-positive"
              : "border-line text-ink hover:bg-surface-muted",
          )}
        >
          {isShortlisted ? "Shortlisted ✓" : "Shortlist"}
        </button>
        {isPurchased ? (
          <span className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-positive/40 bg-positive/12 px-4 text-sm font-medium text-positive">
            Purchased ✓
          </span>
        ) : (
          canConvert && (
            <button
              onClick={() => setConverting(true)}
              className="inline-flex min-h-[2.5rem] items-center rounded-lg border border-positive/40 bg-positive/12 px-4 text-sm font-medium text-positive hover:opacity-90"
            >
              I bought this home
            </button>
          )
        )}
      </div>

      {/* Secondary actions, deliberately quiet */}
      <div className="no-print mb-6 flex flex-wrap gap-x-4 gap-y-1 text-sm">
        <button onClick={() => setEditing(true)} className="text-ink-muted hover:text-ink">
          Edit
        </button>
        <button onClick={() => window.print()} className="text-ink-muted hover:text-ink">
          Print report
        </button>
        <button
          onClick={() => (property.isArchived ? restoreProperty(property.id) : archiveProperty(property.id))}
          className="text-ink-muted hover:text-ink"
        >
          {property.isArchived ? "Restore" : "Archive"}
        </button>
        <button onClick={() => setConfirmDelete(true)} className="text-critical hover:underline">
          Delete
        </button>
      </div>

      {e.missing.length > 0 && (
        <Callout tone="caution" className="mb-6">
          <span className="font-medium">Missing critical information:</span> {e.missing.join(" · ")}
        </Callout>
      )}

      {/* Tabs */}
      <div className="no-print mb-6 flex gap-1 border-b border-line">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={cn(
              "whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors",
              tab === t ? "border-accent text-ink" : "border-transparent text-ink-muted hover:text-ink",
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === "Overview" && (
        <div className="space-y-6 print-block">
          <Panel className="p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Details</h2>
            <DefinitionGrid
              rows={[
                ["Asking price", money(property.askingPrice)],
                ["Offer price", money(property.offerPrice)],
                ["Final sale price", money(property.finalSalePrice)],
                ["Annual taxes", money(property.annualPropertyTaxes)],
                ["HOA (monthly)", money(property.hoaMonthly)],
                ["Bedrooms", num(property.bedrooms)],
                ["Bathrooms", num(property.bathrooms)],
                ["Square footage", num(property.squareFootage)],
                ["Lot size", property.lotSize || "—"],
                ["Year built", num(property.yearBuilt)],
                ["Property type", PROPERTY_TYPE_LABELS[property.propertyType]],
                ["Days on market", num(property.daysOnMarket)],
                ["Date added", dateLabel(property.dateAdded)],
                ["Showing date", dateLabel(property.showingDate)],
              ]}
            />
          </Panel>

          <div className="no-print">
            <DealSection property={property} deal={deal ?? undefined} financial={financial} />
          </div>
        </div>
      )}

      {tab === "Visit" && (
        <Panel className="p-5">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-lg text-ink">Visits · {(visits ?? []).length}</h2>
            <Link href={`/visit/${property.id}`} className="no-print text-sm text-accent hover:underline">
              Open visit mode →
            </Link>
          </div>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            {(visits ?? []).map((v) => (
              <li key={v.id}>
                Visited {dateLabel(v.visitDate)}
                {v.stillWantAfterExcitement ? ` — "${v.stillWantAfterExcitement.slice(0, 60)}"` : ""}
              </li>
            ))}
            {(visits ?? []).length === 0 && <li className="text-ink-subtle">No visits recorded yet.</li>}
          </ul>
        </Panel>
      )}

      {tab === "Money" && (
        <Panel className="p-5 sm:p-6 print-block">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-display text-lg text-ink">Estimated cost & fit</h2>
            <BandPill band={e.overallBand} />
          </div>

          <div className="mb-4 space-y-2">
            <GuardrailNote band={e.priceBand} subject="purchase price" />
            <GuardrailNote band={e.paymentBand} subject="payment" />
            {e.reserveBand === "beyond-limit" && (
              <Callout tone="critical">
                Estimated post-closing cash falls below your minimum reserve.
              </Callout>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Lender-style monthly payment</h3>
              <dl className="space-y-1.5 text-sm">
                <MoneyRow label="Principal & interest" value={moneyPerMonth(plan.lender.principalAndInterest)} />
                <MoneyRow label="Property taxes" value={moneyPerMonth(plan.lender.monthlyTaxes)} />
                <MoneyRow label="Homeowners insurance" value={moneyPerMonth(plan.lender.monthlyInsurance)} />
                <MoneyRow label="HOA" value={moneyPerMonth(plan.lender.monthlyHoa)} />
                <MoneyRow label="Mortgage insurance" value={moneyPerMonth(plan.lender.monthlyPmi)} />
                <MoneyRow label="Total (PITI + HOA)" value={moneyPerMonth(plan.lender.total)} strong />
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Real monthly ownership cost</h3>
              <dl className="space-y-1.5 text-sm">
                <MoneyRow label="Lender-style payment" value={moneyPerMonth(plan.lender.total)} />
                <MoneyRow label="Maintenance reserve" value={moneyPerMonth(plan.maintenanceMonthly)} />
                <MoneyRow label="Estimated real cost" value={moneyPerMonth(plan.realMonthlyOwnershipCost)} strong />
              </dl>
              <h3 className="mb-2 mt-4 text-sm font-medium text-ink">Income share (estimates)</h3>
              <dl className="space-y-1.5 text-sm">
                <MoneyRow label="Of gross income" value={percent(plan.housingPctOfGross)} />
                <MoneyRow label="Of take-home" value={percent(plan.housingPctOfTakeHome)} />
                <MoneyRow label="Total DTI" value={percent(plan.totalDti)} />
              </dl>
            </div>
            <div>
              <h3 className="mb-2 text-sm font-medium text-ink">Cash at closing</h3>
              <dl className="space-y-1.5 text-sm">
                <MoneyRow label="Cash required" value={money(plan.cashRequiredAtClosing)} />
                <MoneyRow label="Cash remaining" value={money(plan.cashRemainingAfterClosing)} strong />
                <MoneyRow label="vs. minimum reserve" value={money(plan.differenceFromMinReserve)} />
                <MoneyRow label="vs. preferred reserve" value={money(plan.differenceFromPreferredReserve)} />
              </dl>
            </div>
          </div>
          <p className="mt-4 text-xs text-ink-subtle">
            Estimates use your planning defaults where property values are blank. Retirement funds are
            never counted as available closing cash.
          </p>
        </Panel>
      )}

      {tab === "Research" && (
        <div className="space-y-6 print-block">
          <Panel className="p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Location & schools</h2>
            <DefinitionGrid
              rows={[
                ["Station", property.stationName || "—"],
                ["Distance to station", property.distanceToStation || "—"],
                ["Parking", PARKING_LABELS[property.parking]],
                ["Drive to station", property.driveToStationMinutes ? `${property.driveToStationMinutes} min` : "—"],
                ["Door-to-door commute", property.doorToDoorCommuteMinutes ? `${property.doorToDoorCommuteMinutes} min` : "—"],
                ["Traffic", TRAFFIC_LABELS[property.trafficLevel]],
                ["Elementary", property.schools.elementary || "—"],
                ["Middle", property.schools.middle || "—"],
                ["High", property.schools.high || "—"],
                ["School rating/metric", property.schools.ratingMetric || "—"],
                ["School source", property.schools.source || "—"],
                ["School verified", property.schools.verifiedDate ? dateLabel(property.schools.verifiedDate) : "Not verified"],
              ]}
            />
            {property.schools.notes && (
              <p className="mt-3 whitespace-pre-wrap text-sm text-ink-muted">{property.schools.notes}</p>
            )}
            {(property.neighborhoodNotes || property.floodZoneNotes || property.roadNoise) && (
              <div className="mt-3 space-y-1 text-sm text-ink-muted">
                {property.neighborhoodNotes && <p>Neighborhood: {property.neighborhoodNotes}</p>}
                {property.floodZoneNotes && <p>Flood: {property.floodZoneNotes}</p>}
                {property.roadNoise && <p>Road noise: {property.roadNoise}</p>}
              </div>
            )}
          </Panel>

          <Panel className="p-5">
            <h2 className="mb-3 font-display text-lg text-ink">Your ratings</h2>
            <div className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
              {RATING_DISPLAY.map((r) => (
                <div key={r.key} className="flex items-center justify-between gap-3 text-sm">
                  <span className="text-ink-muted">{r.label}</span>
                  <RatingDots value={property.ratings[r.key]} />
                </div>
              ))}
            </div>
            {e.score !== null && (
              <p className="mt-3 text-sm text-ink-muted">
                Overall score: <span className="font-medium text-ink">{e.score.toFixed(1)} / 5</span>
              </p>
            )}
          </Panel>
        </div>
      )}

      {tab === "Notes" && (
        <div className="space-y-4">
          <Panel className="p-5 print-block">
            <h2 className="mb-3 font-display text-lg text-ink">Notes (from Edit)</h2>
            {property.notes ? (
              <p className="whitespace-pre-wrap text-sm text-ink">{property.notes}</p>
            ) : (
              <p className="text-sm text-ink-subtle">No notes yet. Add some from Edit.</p>
            )}
          </Panel>

          <div className="no-print space-y-4">
            <NoteContextPanel contextType="property" contextId={property.id} title="Notes about this home" />
            {deal && <NoteContextPanel contextType="deal" contextId={deal.id} title="Notes about the offer" />}
          </div>
        </div>
      )}

      <Overlay open={editing} onClose={() => setEditing(false)} title="Edit property" variant="drawer">
        <PropertyForm property={property} onDone={() => setEditing(false)} />
      </Overlay>

      <ConvertToHomeownerDialog
        open={converting}
        onClose={() => setConverting(false)}
        property={property}
        deal={deal ?? undefined}
      />

      <ConfirmDialog
        open={confirmDelete}
        title="Delete this property?"
        tone="critical"
        confirmLabel="Delete permanently"
        body={
          <span>
            This removes <strong>{property.address}</strong> and its visit notes from this device.
            This cannot be undone. Consider archiving instead if you might revisit it.
          </span>
        }
        onConfirm={handleDelete}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function MoneyRow({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between gap-4 ${strong ? "border-t border-line pt-1.5" : ""}`}>
      <dt className="text-ink-muted">{label}</dt>
      <dd className={strong ? "font-semibold text-ink" : "text-ink"}>{value}</dd>
    </div>
  );
}

function DefinitionGrid({ rows }: { rows: [string, string][] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
      {rows.map(([label, value]) => (
        <div key={label} className="flex items-center justify-between gap-4 text-sm">
          <dt className="text-ink-muted">{label}</dt>
          <dd className="text-right text-ink">{value}</dd>
        </div>
      ))}
    </dl>
  );
}
