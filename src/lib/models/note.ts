import { z } from "zod";
import { baseEntitySchema } from "./common";

/**
 * A freeform note, shared across buyer and homeowner mode alike. Deliberately
 * mode-neutral — no stage/category reference like `documentRecordSchema` has
 * — which is what makes it safe to expose in both nav configurations without
 * showing mode-specific content in the wrong mode.
 */
export const noteSchema = baseEntitySchema.extend({
  title: z.string().default(""),
  body: z.string().min(1),
  pinned: z.boolean().default(false),
});
export type Note = z.infer<typeof noteSchema>;
