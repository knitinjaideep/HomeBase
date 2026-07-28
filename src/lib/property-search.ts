import type { Property } from "./models";

/**
 * Whether a property matches the Homes search box. The query is trimmed and
 * lower-cased first, so a blank or whitespace-only query matches everything
 * (the box simply is not filtering) and clearing the field cleanly restores
 * the full list. This is a local filter over already-loaded rows — it never
 * performs an external lookup and never creates a property.
 */
export function propertyMatchesSearch(
  property: Pick<Property, "address" | "town">,
  rawQuery: string,
): boolean {
  const q = rawQuery.trim().toLowerCase();
  if (!q) return true;
  return (
    property.address.toLowerCase().includes(q) || property.town.toLowerCase().includes(q)
  );
}
