/**
 * Adapters between the property FORM draft and the persisted Property domain
 * object. Kept pure (no Supabase, no React) so the draft/persisted boundary is
 * unit-testable and never runs persisted validation during render.
 *
 * - `emptyPropertyForm` / `propertyToForm` produce draft values the form can
 *   render immediately — a blank draft never needs a generated id, timestamps,
 *   or a non-empty address just to appear on screen.
 * - `prepareProperty` runs only at save time: it trims the identity fields,
 *   rejects an empty or whitespace-only address with an inline message, and
 *   validates the full persisted shape with `safeParse` so an expected
 *   validation failure is returned, never thrown.
 */

import { newId, now } from "./util";
import {
  propertyFormSchema,
  propertySchema,
  type Property,
  type PropertyFormValues,
} from "./models";

/** A blank property draft — safe to render immediately (empty address allowed). */
export function emptyPropertyForm(): PropertyFormValues {
  return propertyFormSchema.parse({});
}

/** Editable draft values for an existing property, dropping persistence-only
 *  fields (id, timestamps, sample/archive flags) so edits start from its real
 *  values without carrying identity into the form state. */
export function propertyToForm(property: Property): PropertyFormValues {
  return propertyFormSchema.parse(property);
}

/**
 * Build a persisted Property from draft values, generating identity fields for
 * a new record or preserving them when editing. Returns a Zod safeParse result
 * so the caller can surface issues instead of throwing.
 */
function draftToProperty(
  values: PropertyFormValues,
  existing?: Property,
): ReturnType<typeof propertySchema.safeParse> {
  const ts = now();
  const identity = existing ?? { id: newId(), createdAt: ts, dateAdded: ts.slice(0, 10) };
  return propertySchema.safeParse({ ...identity, ...values, updatedAt: ts });
}

export type PreparePropertyResult =
  | { ok: true; property: Property }
  | { ok: false; addressError: string }
  | { ok: false; formError: string };

/**
 * Turn raw form values into a persisted Property, or an actionable error.
 * Trims address/town/ZIP, rejects an empty or whitespace-only address inline,
 * and validates the complete persisted shape without ever throwing.
 */
export function prepareProperty(
  values: PropertyFormValues,
  existing?: Property,
): PreparePropertyResult {
  const address = values.address.trim();
  if (!address) return { ok: false, addressError: "Enter a property address." };

  const cleaned: PropertyFormValues = {
    ...values,
    address,
    town: values.town.trim(),
    zip: values.zip.trim(),
  };

  const parsed = draftToProperty(cleaned, existing);
  if (!parsed.success) {
    const addressIssue = parsed.error.issues.find((issue) => issue.path[0] === "address");
    if (addressIssue) return { ok: false, addressError: "Enter a property address." };
    return {
      ok: false,
      formError: "Some details could not be saved. Please review and try again.",
    };
  }
  return { ok: true, property: parsed.data };
}
