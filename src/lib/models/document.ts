import { z } from "zod";
import { baseEntitySchema, idSchema } from "./common";

/**
 * A document record — a household record with an optional real file
 * attached (see `filePath`/lib/documents/storage.ts, backed by a private
 * Supabase Storage bucket) plus the same index fields the app always had
 * (`storedLocation` for a physical original, category, notes). The file is
 * optional: a household can log "the original is in the home safe" without
 * ever uploading anything.
 */

export const documentCategorySchema = z.enum([
  "identification",
  "income",
  "employment",
  "attending-contract",
  "taxes",
  "bank-statements",
  "investment-statements",
  "credit",
  "preapproval",
  "lender-quotes",
  "buyer-agreement",
  "property-disclosures",
  "offer",
  "contract",
  "attorney-review",
  "inspection",
  "appraisal",
  "insurance",
  "loan-estimate",
  "closing-disclosure",
  "closing-documents",
  // Owner-mode categories (maintenance/repairs) — see relatedMaintenanceItemId
  // / relatedRepairProjectId below.
  "warranty",
  "receipt",
  "manual",
  "photo",
  "home-record",
  // Owner-mode categories added for the Documents redesign — see
  // src/lib/documents/categories.ts for how the full list above is grouped
  // into buyer/owner-facing sections.
  "appliances-systems",
  "repairs-renovations",
  "hoa-condo",
  "utilities",
]);
export type DocumentCategory = z.infer<typeof documentCategorySchema>;

export const documentStatusSchema = z.enum([
  "needed",
  "requested",
  "gathered",
  "submitted",
  "not-applicable",
]);
export type DocumentStatus = z.infer<typeof documentStatusSchema>;

export const documentRecordSchema = baseEntitySchema.extend({
  name: z.string().min(1),
  category: documentCategorySchema.default("identification"),
  status: documentStatusSchema.default("needed"),
  /** The date on the document itself (e.g. the tax year end), not when we filed it. */
  documentDate: z.string().nullable().default(null),
  relatedStageId: z.string().nullable().default(null),
  relatedPropertyId: idSchema.nullable().default(null),
  /** Owner mode: optionally links a document to one maintenance item or repair project. */
  relatedMaintenanceItemId: idSchema.nullable().default(null),
  relatedRepairProjectId: idSchema.nullable().default(null),
  /** Where a physical original lives — "home safe", "shared drive folder", etc. Independent of `filePath`. */
  storedLocation: z.string().default(""),
  notes: z.string().default(""),
  tags: z.array(z.string()).default([]),
  /** Renewal/expiration date the user entered — e.g. an insurance policy or warranty end date. */
  expirationDate: z.string().nullable().default(null),
  /** The uploaded file, if any — see lib/documents/storage.ts. All four travel together. */
  filePath: z.string().nullable().default(null),
  fileName: z.string().nullable().default(null),
  fileSize: z.number().int().nullable().default(null),
  fileMimeType: z.string().nullable().default(null),
});
export type DocumentRecord = z.infer<typeof documentRecordSchema>;
