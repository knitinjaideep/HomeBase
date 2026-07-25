import { z } from "zod";
import { baseEntitySchema, idSchema } from "./common";

/**
 * A document *index* — a record that a document exists and where it lives. The
 * app deliberately stores no files: sensitive paperwork does not belong in
 * browser storage.
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
  /** Where the real file lives — "home safe", "shared drive folder", etc. */
  storedLocation: z.string().default(""),
  notes: z.string().default(""),
});
export type DocumentRecord = z.infer<typeof documentRecordSchema>;
