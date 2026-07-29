import { getStage } from "@/lib/guide";
import type { Deal, DocumentRecord, Note, NoteContextType, Professional, Property, PropertyVisit } from "@/lib/models";

/**
 * Household-scoped collections a note's context might resolve against. Every
 * array here must already be filtered to the caller's own household (they
 * always are — these come straight from `useProperties()` / `useDeals()` /
 * etc., which read through RLS) so resolution can never reach across
 * households: a `contextId` that isn't in the array simply doesn't resolve,
 * there is no broader lookup to fall back to.
 */
export interface NoteContextData {
  properties: Pick<Property, "id" | "address">[];
  visits: Pick<PropertyVisit, "id" | "propertyId" | "visitDate">[];
  deals: Pick<Deal, "id" | "propertyId">[];
  documents: Pick<DocumentRecord, "id" | "name">[];
  professionals: Pick<Professional, "id" | "name">[];
}

export interface ResolvedNoteContext {
  label: string;
  /** Where to open the linked record, or null when there's nowhere to send the user. */
  href: string | null;
  /** False when the note has a context but the thing it pointed to can no longer be found. */
  available: boolean;
}

/**
 * Resolve a note's `contextType`/`contextId` against already-loaded
 * household data. Returns `null` for a general note (no context). Returns
 * `available: false` — never throws, never signals the note itself is
 * invalid — when a linked object (property, visit, deal, document,
 * professional) was deleted after the note was written; the note's own data
 * is untouched either way. See supabase/migrations/0019 for why this is
 * resolved here instead of with a foreign key.
 */
export function resolveNoteContext(note: Note, data: NoteContextData): ResolvedNoteContext | null {
  const { contextType, contextId } = note;
  if (!contextType) return null;

  switch (contextType) {
    case "journeyStage": {
      const stage = contextId ? getStage(contextId) : undefined;
      return stage
        ? { label: `Journey: ${stage.shortTitle}`, href: `/journey/${stage.id}`, available: true }
        : { label: "Journey stage", href: null, available: false };
    }
    case "property": {
      const property = contextId ? data.properties.find((p) => p.id === contextId) : undefined;
      return property
        ? { label: property.address, href: `/properties/${property.id}`, available: true }
        : { label: "Candidate home", href: null, available: false };
    }
    case "propertyVisit": {
      const visit = contextId ? data.visits.find((v) => v.id === contextId) : undefined;
      if (!visit) return { label: "Home visit", href: null, available: false };
      const property = data.properties.find((p) => p.id === visit.propertyId);
      return {
        label: property ? `Visit: ${property.address} (${visit.visitDate})` : `Visit (${visit.visitDate})`,
        href: `/visit/${visit.propertyId}`,
        available: true,
      };
    }
    case "deal": {
      const deal = contextId ? data.deals.find((d) => d.id === contextId) : undefined;
      if (!deal) return { label: "Offer / deal", href: null, available: false };
      const property = data.properties.find((p) => p.id === deal.propertyId);
      return {
        label: property ? `Offer: ${property.address}` : "Offer / deal",
        href: `/properties/${deal.propertyId}`,
        available: true,
      };
    }
    case "document": {
      const doc = contextId ? data.documents.find((d) => d.id === contextId) : undefined;
      return doc
        ? { label: `Document: ${doc.name}`, href: "/timeline", available: true }
        : { label: "Document", href: null, available: false };
    }
    case "professional": {
      const professional = contextId ? data.professionals.find((p) => p.id === contextId) : undefined;
      return professional
        ? { label: professional.name, href: "/professionals", available: true }
        : { label: "Person / professional", href: null, available: false };
    }
    case "ownedHome":
      return { label: "Owned home", href: "/homebase", available: true };
    case "maintenanceItem":
      return { label: "Maintenance item", href: "/maintenance", available: true };
    case "repairProject":
      return { label: "Repair or project", href: "/maintenance", available: true };
  }
}

export interface InferredContext {
  type: NoteContextType;
  id: string | null;
}

/**
 * The default context Quick Note offers for the page the user is currently
 * on, based purely on the URL — mirrors the prefix-matching style of
 * `lib/workspace/navigation.ts`. Always just a starting point: the composer's
 * context picker lets the user change or clear it before saving.
 */
export function inferContextFromPath(pathname: string, params: Record<string, string | string[]>): InferredContext | null {
  const paramId = (key: string): string | null => {
    const value = params[key];
    return typeof value === "string" && value.length > 0 ? value : null;
  };

  if (pathname.startsWith("/visit/")) {
    return { type: "propertyVisit", id: null };
  }
  if (pathname.startsWith("/properties/")) {
    const id = paramId("id");
    return id ? { type: "property", id } : null;
  }
  if (pathname.startsWith("/journey/")) {
    const id = paramId("stageId");
    return id ? { type: "journeyStage", id } : null;
  }
  if (pathname === "/homebase" || pathname.startsWith("/homebase/")) {
    return { type: "ownedHome", id: null };
  }
  if (pathname === "/maintenance" || pathname.startsWith("/maintenance/")) {
    return { type: "maintenanceItem", id: null };
  }
  return null;
}
