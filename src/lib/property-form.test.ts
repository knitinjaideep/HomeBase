import { describe, it, expect } from "vitest";
import { propertySchema, type Property } from "@/lib/models";
import { emptyPropertyForm, prepareProperty, propertyToForm } from "@/lib/property-form";

/** A valid persisted property to drive edit-mode tests. */
const existing: Property = propertySchema.parse({
  id: "prop-1",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  dateAdded: "2026-01-01",
  address: "10 Existing Way",
  town: "Montclair",
  zip: "07042",
  status: "shortlisted",
  schools: {},
  ratings: {},
  finance: {},
});

describe("emptyPropertyForm", () => {
  it("produces a renderable draft with an empty address and never throws", () => {
    expect(() => emptyPropertyForm()).not.toThrow();
    const draft = emptyPropertyForm();
    expect(draft.address).toBe("");
    expect(draft.town).toBe("");
    expect(draft.zip).toBe("");
    expect(draft.status).toBe("saved");
  });

  it("carries no persisted identity fields — a draft needs no id/timestamps to render", () => {
    const draft = emptyPropertyForm() as Record<string, unknown>;
    expect(draft.id).toBeUndefined();
    expect(draft.createdAt).toBeUndefined();
    expect(draft.updatedAt).toBeUndefined();
    expect(draft.dateAdded).toBeUndefined();
  });
});

describe("propertyToForm (edit mode)", () => {
  it("loads the existing record's editable values", () => {
    const form = propertyToForm(existing);
    expect(form.address).toBe("10 Existing Way");
    expect(form.town).toBe("Montclair");
    expect(form.status).toBe("shortlisted");
  });

  it("drops persistence-only fields so identity never lives in form state", () => {
    const form = propertyToForm(existing) as Record<string, unknown>;
    expect(form.id).toBeUndefined();
    expect(form.createdAt).toBeUndefined();
    expect(form.isSample).toBeUndefined();
  });
});

describe("prepareProperty", () => {
  it("rejects an empty address with an inline message and yields no property", () => {
    const result = prepareProperty({ ...emptyPropertyForm(), address: "" });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ addressError: "Enter a property address." });
    expect("property" in result).toBe(false); // nothing to persist
  });

  it("rejects a whitespace-only address cleanly (trimmed, not stored)", () => {
    const result = prepareProperty({ ...emptyPropertyForm(), address: "   " });
    expect(result.ok).toBe(false);
    expect(result).toMatchObject({ addressError: "Enter a property address." });
  });

  it("builds a valid new property, trimming identity fields and generating an id", () => {
    const result = prepareProperty({
      ...emptyPropertyForm(),
      address: "  123 Main St  ",
      town: "  Maplewood ",
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.property.address).toBe("123 Main St");
    expect(result.property.town).toBe("Maplewood");
    expect(result.property.id).toBeTruthy();
    expect(result.property.isSample).toBe(false);
    expect(result.property.isArchived).toBe(false);
  });

  it("preserves id/createdAt/dateAdded when editing an existing property", () => {
    const result = prepareProperty({ ...propertyToForm(existing), address: "99 New Rd" }, existing);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.property.id).toBe("prop-1");
    expect(result.property.createdAt).toBe(existing.createdAt);
    expect(result.property.dateAdded).toBe(existing.dateAdded);
    expect(result.property.address).toBe("99 New Rd");
  });
});
