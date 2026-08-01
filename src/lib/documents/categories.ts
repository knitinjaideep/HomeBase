import type { DocumentCategory } from "@/lib/models";
import type { ResolvedMode } from "@/lib/workspace/resolver";

/**
 * How the full `documentCategorySchema` list is grouped into the sections a
 * buyer or homeowner actually sees. Purely a display grouping — the
 * category value stored on a document never changes, so this can be edited
 * freely without any data migration. Some categories (the closing/
 * insurance/taxes paperwork that carries forward past the purchase)
 * deliberately appear in both mode's groups; everything else appears in
 * exactly one.
 */
export interface DocumentCategoryGroup {
  label: string;
  categories: DocumentCategory[];
}

export const BUYER_DOCUMENT_CATEGORY_GROUPS: DocumentCategoryGroup[] = [
  { label: "Financial preparation", categories: ["identification", "income", "employment", "taxes", "bank-statements", "investment-statements", "credit"] },
  { label: "Preapproval", categories: ["preapproval", "lender-quotes"] },
  { label: "Agent and attorney", categories: ["buyer-agreement", "attorney-review"] },
  { label: "Property disclosures", categories: ["property-disclosures"] },
  { label: "Inspection", categories: ["inspection"] },
  { label: "Offer and contract", categories: ["attending-contract", "offer", "contract"] },
  { label: "Appraisal", categories: ["appraisal"] },
  { label: "Insurance", categories: ["insurance"] },
  { label: "Closing", categories: ["loan-estimate", "closing-disclosure", "closing-documents"] },
];

export const OWNER_DOCUMENT_CATEGORY_GROUPS: DocumentCategoryGroup[] = [
  { label: "Closing records", categories: ["loan-estimate", "closing-disclosure", "closing-documents"] },
  { label: "Insurance", categories: ["insurance"] },
  { label: "Taxes", categories: ["taxes"] },
  { label: "Warranty", categories: ["warranty"] },
  { label: "Appliances and systems", categories: ["appliances-systems", "manual"] },
  { label: "Maintenance receipts", categories: ["receipt"] },
  { label: "Repairs and renovations", categories: ["repairs-renovations"] },
  { label: "HOA or condo", categories: ["hoa-condo"] },
  { label: "Utilities", categories: ["utilities"] },
  { label: "Other home records", categories: ["home-record", "photo"] },
];

/** Falls back to the buyer grouping when mode is unselected — matches `getNavigationForMode`'s convention. */
export function documentCategoryGroupsForMode(mode: ResolvedMode): DocumentCategoryGroup[] {
  return mode === "owning" ? OWNER_DOCUMENT_CATEGORY_GROUPS : BUYER_DOCUMENT_CATEGORY_GROUPS;
}

/** Every category covered by at least one of a mode's groups — the options offered on the add/edit form. */
export function documentCategoriesForMode(mode: ResolvedMode): DocumentCategory[] {
  const groups = documentCategoryGroupsForMode(mode);
  const seen = new Set<DocumentCategory>();
  const ordered: DocumentCategory[] = [];
  for (const group of groups) {
    for (const category of group.categories) {
      if (!seen.has(category)) {
        seen.add(category);
        ordered.push(category);
      }
    }
  }
  return ordered;
}
