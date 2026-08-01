import { describe, it, expect } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { documentRecordSchema, type DocumentRecord } from "@/lib/models";
import { ExpiringDocumentsPanel, RecentDocumentsStrip } from "./document-index";

function doc(overrides: Partial<DocumentRecord> & { name: string }): DocumentRecord {
  return documentRecordSchema.parse({
    id: overrides.name,
    createdAt: "2026-07-28T00:00:00.000Z",
    updatedAt: "2026-07-28T00:00:00.000Z",
    ...overrides,
  });
}

describe("ExpiringDocumentsPanel", () => {
  it("renders nothing for an empty list", () => {
    const html = renderToStaticMarkup(<ExpiringDocumentsPanel documents={[]} />);
    expect(html).toBe("");
  });

  it("shows the document name and its entered expiration date", () => {
    const html = renderToStaticMarkup(
      <ExpiringDocumentsPanel documents={[doc({ name: "Homeowners insurance", expirationDate: "2026-08-01" })]} />,
    );
    expect(html).toContain("Homeowners insurance");
    expect(html).toContain("2026-08-01");
    expect(html).toContain("Expiring or renewal dates");
  });

  it("uses responsive-safe layout classes, not a fixed pixel width", () => {
    const html = renderToStaticMarkup(
      <ExpiringDocumentsPanel documents={[doc({ name: "Warranty", expirationDate: "2026-08-01" })]} />,
    );
    expect(html).toContain("flex-wrap");
    expect(html).not.toMatch(/width:\s*\d+px/);
  });
});

describe("RecentDocumentsStrip", () => {
  it("renders nothing for an empty list", () => {
    const html = renderToStaticMarkup(<RecentDocumentsStrip documents={[]} />);
    expect(html).toBe("");
  });

  it("shows each document's name and category label", () => {
    const html = renderToStaticMarkup(<RecentDocumentsStrip documents={[doc({ name: "Preapproval letter", category: "preapproval" })]} />);
    expect(html).toContain("Preapproval letter");
    expect(html).toContain("Preapproval");
    expect(html).toContain("flex-wrap");
  });
});
