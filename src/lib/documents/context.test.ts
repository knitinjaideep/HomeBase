import { describe, it, expect } from "vitest";
import { resolveDocumentLinkedRecords, type DocumentContextData } from "./context";

const data: DocumentContextData = {
  properties: [{ id: "prop-1", address: "12 Maple St" }],
  maintenanceItems: [{ id: "item-1", title: "Replace furnace filter" }],
  repairProjects: [{ id: "proj-1", title: "Reshingle roof" }],
};

describe("resolveDocumentLinkedRecords", () => {
  it("returns nothing for a document with no links", () => {
    expect(
      resolveDocumentLinkedRecords(
        { relatedPropertyId: null, relatedMaintenanceItemId: null, relatedRepairProjectId: null },
        data,
      ),
    ).toEqual([]);
  });

  it("links a document to a candidate home", () => {
    const links = resolveDocumentLinkedRecords(
      { relatedPropertyId: "prop-1", relatedMaintenanceItemId: null, relatedRepairProjectId: null },
      data,
    );
    expect(links).toEqual([
      { kind: "property", label: "12 Maple St", href: "/properties/prop-1", available: true },
    ]);
  });

  it("shows a candidate home link as unavailable once the property is deleted", () => {
    const links = resolveDocumentLinkedRecords(
      { relatedPropertyId: "deleted-prop", relatedMaintenanceItemId: null, relatedRepairProjectId: null },
      data,
    );
    expect(links).toEqual([{ kind: "property", label: "Candidate home", href: null, available: false }]);
  });

  it("links a receipt to a maintenance item", () => {
    const links = resolveDocumentLinkedRecords(
      { relatedPropertyId: null, relatedMaintenanceItemId: "item-1", relatedRepairProjectId: null },
      data,
    );
    expect(links).toEqual([
      { kind: "maintenanceItem", label: "Replace furnace filter", href: "/maintenance?item=item-1", available: true },
    ]);
  });

  it("links a document to a repair project", () => {
    const links = resolveDocumentLinkedRecords(
      { relatedPropertyId: null, relatedMaintenanceItemId: null, relatedRepairProjectId: "proj-1" },
      data,
    );
    expect(links).toEqual([
      { kind: "repairProject", label: "Reshingle roof", href: "/maintenance?project=proj-1", available: true },
    ]);
  });

  it("shows a maintenance link as unavailable once the item is deleted", () => {
    const links = resolveDocumentLinkedRecords(
      { relatedPropertyId: null, relatedMaintenanceItemId: "deleted-item", relatedRepairProjectId: null },
      data,
    );
    expect(links).toEqual([{ kind: "maintenanceItem", label: "Maintenance item", href: null, available: false }]);
  });
});
