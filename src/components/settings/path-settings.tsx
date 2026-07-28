"use client";

import { useRouter } from "next/navigation";
import { Button, Panel } from "@/components/ui";
import { useActiveWorkspace } from "@/lib/workspace/hooks";
import type { ResolvedMode } from "@/lib/workspace/resolver";

const PATH_LABEL: Record<ResolvedMode, string> = {
  buying: "Buying a home",
  owning: "Owning a home",
  unselected: "Not chosen yet",
};

/**
 * The explicit, non-prominent way to revisit or change the active path
 * (the mode toggle deliberately stays out of the main navigation). Changing
 * the path keeps all existing data — it only re-points the active experience.
 */
export function PathSettings() {
  const router = useRouter();
  const view = useActiveWorkspace();
  const label = view ? PATH_LABEL[view.mode] : "…";

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-1 font-display text-lg text-ink">HomeScope path</h2>
      <p className="mb-4 max-w-2xl text-sm text-ink-muted">
        Your active path decides what HomeScope focuses on. Switching keeps everything you’ve
        saved — it just changes the experience you see.
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="text-sm text-ink">
          <span className="text-ink-muted">Current path:</span>{" "}
          <span className="font-medium">{label}</span>
        </div>
        <Button variant="secondary" onClick={() => router.push("/paths")}>
          Change path
        </Button>
      </div>
    </Panel>
  );
}
