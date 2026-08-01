import { describe, it, expect } from "vitest";
import { documentCategorySchema, type DocumentCategory } from "@/lib/models";
import {
  BUYER_DOCUMENT_CATEGORY_GROUPS,
  OWNER_DOCUMENT_CATEGORY_GROUPS,
  documentCategoriesForMode,
  documentCategoryGroupsForMode,
} from "./categories";

const ALL_CATEGORIES = documentCategorySchema.options;

describe("BUYER_DOCUMENT_CATEGORY_GROUPS", () => {
  it("uses the task's buyer section names", () => {
    const labels = BUYER_DOCUMENT_CATEGORY_GROUPS.map((g) => g.label);
    expect(labels).toEqual([
      "Financial preparation",
      "Preapproval",
      "Agent and attorney",
      "Property disclosures",
      "Inspection",
      "Offer and contract",
      "Appraisal",
      "Insurance",
      "Closing",
    ]);
  });

  it("only ever places real category values", () => {
    for (const group of BUYER_DOCUMENT_CATEGORY_GROUPS) {
      for (const category of group.categories) {
        expect(ALL_CATEGORIES).toContain(category);
      }
    }
  });
});

describe("OWNER_DOCUMENT_CATEGORY_GROUPS", () => {
  it("uses the task's owner section names", () => {
    const labels = OWNER_DOCUMENT_CATEGORY_GROUPS.map((g) => g.label);
    expect(labels).toEqual([
      "Closing records",
      "Insurance",
      "Taxes",
      "Warranty",
      "Appliances and systems",
      "Maintenance receipts",
      "Repairs and renovations",
      "HOA or condo",
      "Utilities",
      "Other home records",
    ]);
  });

  it("covers every new owner-mode category added for this redesign", () => {
    const covered = new Set(OWNER_DOCUMENT_CATEGORY_GROUPS.flatMap((g) => g.categories));
    const newCategories: DocumentCategory[] = ["appliances-systems", "repairs-renovations", "hoa-condo", "utilities"];
    for (const category of newCategories) {
      expect(covered.has(category)).toBe(true);
    }
  });

  it("only ever places real category values", () => {
    for (const group of OWNER_DOCUMENT_CATEGORY_GROUPS) {
      for (const category of group.categories) {
        expect(ALL_CATEGORIES).toContain(category);
      }
    }
  });
});

describe("documentCategoryGroupsForMode", () => {
  it("gives buyers the buyer groups and owners the owner groups", () => {
    expect(documentCategoryGroupsForMode("buying")).toBe(BUYER_DOCUMENT_CATEGORY_GROUPS);
    expect(documentCategoryGroupsForMode("owning")).toBe(OWNER_DOCUMENT_CATEGORY_GROUPS);
  });

  it("falls back to the buyer grouping when mode is unselected", () => {
    expect(documentCategoryGroupsForMode("unselected")).toBe(BUYER_DOCUMENT_CATEGORY_GROUPS);
  });
});

describe("documentCategoriesForMode", () => {
  it("always requires an explicit category — never infers one from a file", () => {
    // documentCategoriesForMode only ever returns the fixed, curated list for
    // the mode; there is no path from a File/upload into a category value.
    const buyerCategories = documentCategoriesForMode("buying");
    const ownerCategories = documentCategoriesForMode("owning");
    expect(buyerCategories.length).toBeGreaterThan(0);
    expect(ownerCategories.length).toBeGreaterThan(0);
    for (const c of [...buyerCategories, ...ownerCategories]) {
      expect(ALL_CATEGORIES).toContain(c);
    }
  });

  it("de-duplicates categories shared across groups (e.g. insurance/taxes/closing for owners)", () => {
    const ownerCategories = documentCategoriesForMode("owning");
    expect(new Set(ownerCategories).size).toBe(ownerCategories.length);
  });
});
