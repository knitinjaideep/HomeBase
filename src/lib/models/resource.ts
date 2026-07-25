import { z } from "zod";
import { baseEntitySchema } from "./common";

/**
 * A curated external reference. The app stores a link, our own short summary,
 * and action-oriented notes — never a copy of the article itself.
 */

export const resourcePublisherKindSchema = z.enum([
  "federal-government",
  "nj-government",
  "regulator",
  "consumer-education",
  "professional-organization",
  "secondary",
]);
export type ResourcePublisherKind = z.infer<typeof resourcePublisherKindSchema>;

export const resourceStatusSchema = z.enum(["active", "needs-review", "outdated", "archived"]);
export type ResourceStatus = z.infer<typeof resourceStatusSchema>;

export const resourceSchema = baseEntitySchema.extend({
  title: z.string().min(1),
  organization: z.string().default(""),
  url: z.string().default(""),
  topic: z.string().default(""),
  /** Stage ids this resource supports. A resource may serve several stages. */
  stageIds: z.array(z.string()).default([]),
  /** Our own one- or two-sentence summary. Never the article's text. */
  description: z.string().default(""),
  /** Why this source is worth trusting, in our own words. */
  whyUseful: z.string().default(""),
  publisherKind: resourcePublisherKindSchema.default("secondary"),
  dateAdded: z.string(),
  lastReviewedDate: z.string().nullable().default(null),
  status: resourceStatusSchema.default("active"),
  notes: z.string().default(""),
  isFavorite: z.boolean().default(false),
  /** True for links shipped with the app, so they can be restored or reset. */
  isSeeded: z.boolean().default(false),
});
export type Resource = z.infer<typeof resourceSchema>;
