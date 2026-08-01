import type { DocumentRecord, MaintenanceItem, Property, RepairProject } from "@/lib/models";

/**
 * Household-scoped collections a document's links might resolve against —
 * same shape/contract as `NoteContextData` in lib/notes/context.ts: every
 * array here must already be filtered to the caller's own household (they
 * always are, coming straight from `useProperties()` / `useMaintenanceItems()`
 * / `useRepairProjects()`, which read through RLS).
 */
export interface DocumentContextData {
  properties: Pick<Property, "id" | "address">[];
  maintenanceItems: Pick<MaintenanceItem, "id" | "title">[];
  repairProjects: Pick<RepairProject, "id" | "title">[];
}

export interface ResolvedDocumentLink {
  kind: "property" | "maintenanceItem" | "repairProject";
  label: string;
  href: string | null;
  /** False when the document links to something that's since been deleted. */
  available: boolean;
}

/**
 * Resolve a document's optional links (`relatedPropertyId`,
 * `relatedMaintenanceItemId`, `relatedRepairProjectId`) against
 * already-loaded household data. A document can only have one of these set
 * in practice (the add/edit form only offers the field relevant to the
 * active mode), but nothing at the schema level prevents more than one, so
 * this returns every link that's set rather than assuming exactly one.
 * Never throws — an id that no longer resolves comes back as
 * `available: false`, mirroring `resolveNoteContext`.
 */
export function resolveDocumentLinkedRecords(
  doc: Pick<DocumentRecord, "relatedPropertyId" | "relatedMaintenanceItemId" | "relatedRepairProjectId">,
  data: DocumentContextData,
): ResolvedDocumentLink[] {
  const links: ResolvedDocumentLink[] = [];

  if (doc.relatedPropertyId) {
    const property = data.properties.find((p) => p.id === doc.relatedPropertyId);
    links.push(
      property
        ? { kind: "property", label: property.address, href: `/properties/${property.id}`, available: true }
        : { kind: "property", label: "Candidate home", href: null, available: false },
    );
  }

  if (doc.relatedMaintenanceItemId) {
    const item = data.maintenanceItems.find((i) => i.id === doc.relatedMaintenanceItemId);
    links.push(
      item
        ? { kind: "maintenanceItem", label: item.title, href: `/maintenance?item=${item.id}`, available: true }
        : { kind: "maintenanceItem", label: "Maintenance item", href: null, available: false },
    );
  }

  if (doc.relatedRepairProjectId) {
    const project = data.repairProjects.find((p) => p.id === doc.relatedRepairProjectId);
    links.push(
      project
        ? { kind: "repairProject", label: project.title, href: `/maintenance?project=${project.id}`, available: true }
        : { kind: "repairProject", label: "Repair or project", href: null, available: false },
    );
  }

  return links;
}
