"use client";

import { PageHeader } from "@/components/ui";
import { DocumentIndex } from "@/components/documents/document-index";

/**
 * The shared documents system for both buyer and homeowner mode — see
 * lib/documents/categories.ts for the mode-aware section grouping. Reached
 * from Toolkit in both modes (see lib/toolkit/groups.ts); shared by
 * omission from lib/workspace/navigation.ts, same as /notes.
 */
export default function DocumentsPage() {
  return (
    <div>
      <PageHeader
        title="Documents"
        description="Every home record in one organized place — categorized, searchable, and tracked for what's expiring."
      />
      <DocumentIndex />
    </div>
  );
}
