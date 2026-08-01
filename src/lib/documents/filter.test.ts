import { describe, it, expect } from "vitest";
import { documentRecordSchema, type DocumentRecord } from "@/lib/models";
import { allDocumentTags, documentMatchesSearch, expiringDocuments, filterDocuments } from "./filter";

function doc(overrides: Partial<DocumentRecord> & { name: string }): DocumentRecord {
  return documentRecordSchema.parse({
    id: overrides.name,
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    ...overrides,
  });
}

describe("documentMatchesSearch", () => {
  it("matches on name, notes, stored location, or tags — case-insensitively", () => {
    const d = doc({ name: "2025 Tax Return", notes: "Filed jointly", storedLocation: "Home safe", tags: ["taxes"] });
    expect(documentMatchesSearch(d, "tax")).toBe(true);
    expect(documentMatchesSearch(d, "JOINTLY")).toBe(true);
    expect(documentMatchesSearch(d, "safe")).toBe(true);
    expect(documentMatchesSearch(d, "taxes")).toBe(true);
    expect(documentMatchesSearch(d, "roof")).toBe(false);
  });

  it("a blank query matches everything", () => {
    const d = doc({ name: "Anything" });
    expect(documentMatchesSearch(d, "")).toBe(true);
    expect(documentMatchesSearch(d, "   ")).toBe(true);
  });
});

describe("filterDocuments", () => {
  const docs = [
    doc({ name: "Preapproval letter", category: "preapproval" }),
    doc({ name: "Water heater warranty", category: "warranty", tags: ["appliance"] }),
    doc({ name: "Insurance policy", category: "insurance", expirationDate: "2027-01-01" }),
  ];

  it("filters by category", () => {
    const result = filterDocuments(docs, { category: "warranty" });
    expect(result.map((d) => d.name)).toEqual(["Water heater warranty"]);
  });

  it("filters by search query", () => {
    const result = filterDocuments(docs, { query: "insurance" });
    expect(result.map((d) => d.name)).toEqual(["Insurance policy"]);
  });

  it("filters by tag", () => {
    const result = filterDocuments(docs, { tags: ["appliance"] });
    expect(result.map((d) => d.name)).toEqual(["Water heater warranty"]);
  });

  it("filters to only documents with an expiration date set", () => {
    const result = filterDocuments(docs, { hasExpiration: true });
    expect(result.map((d) => d.name)).toEqual(["Insurance policy"]);
  });

  it("applies every active filter together", () => {
    expect(filterDocuments(docs, { category: "warranty", tags: ["appliance"] })).toHaveLength(1);
    expect(filterDocuments(docs, { category: "warranty", tags: ["nonexistent"] })).toHaveLength(0);
  });

  it("with no filters, returns everything unchanged", () => {
    expect(filterDocuments(docs, {})).toHaveLength(3);
  });
});

describe("allDocumentTags", () => {
  it("returns the sorted union of every tag", () => {
    const docs = [doc({ name: "a", tags: ["roof", "warranty"] }), doc({ name: "b", tags: ["appliance"] })];
    expect(allDocumentTags(docs)).toEqual(["appliance", "roof", "warranty"]);
  });
});

describe("expiringDocuments", () => {
  const today = new Date("2026-07-15T12:00:00.000Z");

  it("includes only expired or expiring-soon documents, soonest first", () => {
    const docs = [
      doc({ name: "Far off", expirationDate: "2027-06-01" }),
      doc({ name: "Already expired", expirationDate: "2026-01-01" }),
      doc({ name: "No date set" }),
      doc({ name: "Expiring soon", expirationDate: "2026-08-01" }),
    ];
    const result = expiringDocuments(docs, today);
    expect(result.map((d) => d.name)).toEqual(["Already expired", "Expiring soon"]);
  });
});
