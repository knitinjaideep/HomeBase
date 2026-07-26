"use client";

import { useEffect, useState } from "react";
import { useHouseholdContext } from "@/lib/household/context";
import { createClient } from "@/lib/supabase/client";
import {
  hasLegacyLocalData,
  hasMigrationDecision,
  migrateLocalDataToCloud,
  previewLegacyBackup,
  skipMigration,
  type MigrationResult,
} from "@/lib/migration";
import type { Backup } from "@/lib/models";
import { Button, Callout } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";

type Phase = "checking" | "hidden" | "found" | "importing" | "done";

/**
 * "Local Home data found" — shown once, only when this specific browser has
 * real pre-existing local data AND this household hasn't made a migration
 * decision yet. Never deletes the local copy; never re-shows after a
 * decision (import or skip) is recorded on the household.
 */
export function MigrationBanner() {
  const { householdId } = useHouseholdContext();
  const { notify } = useToast();
  const [phase, setPhase] = useState<Phase>("checking");
  const [preview, setPreview] = useState<{ backup: Backup; counts: { label: string; count: number }[] } | null>(
    null,
  );
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<MigrationResult | null>(null);

  useEffect(() => {
    (async () => {
      const [localFound, decided] = await Promise.all([
        hasLegacyLocalData(),
        hasMigrationDecision(createClient(), householdId),
      ]);
      setPhase(localFound && !decided ? "found" : "hidden");
    })();
  }, [householdId]);

  const openConfirm = async () => {
    setError(null);
    setBusy(true);
    try {
      const p = await previewLegacyBackup();
      setPreview(p);
      setConfirmOpen(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not read local data.");
    } finally {
      setBusy(false);
    }
  };

  const doImport = async () => {
    setBusy(true);
    setError(null);
    try {
      const r = await migrateLocalDataToCloud(createClient(), householdId);
      setResult(r);
      setPhase("done");
      setConfirmOpen(false);
      notify("Local data imported to the cloud");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Import failed. Nothing local was changed — try again.");
    } finally {
      setBusy(false);
    }
  };

  const dismissForNow = () => setPhase("hidden");

  const dontNeedThis = async () => {
    setBusy(true);
    try {
      await skipMigration(createClient(), householdId);
      setPhase("hidden");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save that choice.");
    } finally {
      setBusy(false);
    }
  };

  if (phase === "checking" || phase === "hidden") return null;

  if (phase === "done" && result) {
    return (
      <div className="no-print border-b border-positive/30 bg-positive/10">
        <div className="mx-auto max-w-content px-4 py-3 text-sm sm:px-6">
          <p className="font-medium text-ink">Local data imported.</p>
          <p className="mt-1 text-ink-muted">
            A backup of the pre-import local data was downloaded to your device.{" "}
            {result.localCounts.filter((c) => c.count > 0).map((c) => `${c.label}: ${c.count}`).join(" · ")}
          </p>
          <button onClick={() => setPhase("hidden")} className="mt-1 text-xs text-accent hover:underline">
            Dismiss
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="no-print border-b border-accent/30 bg-accent-soft">
        <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="text-ink">
            <span className="font-medium">Local Home data found</span> on this device, from before this
            app used the cloud. Import it into your household so it&rsquo;s available on every device.
          </p>
          <div className="flex shrink-0 items-center gap-3">
            <Button size="sm" onClick={openConfirm} disabled={busy}>
              Import to cloud
            </Button>
            <button onClick={dismissForNow} className="text-xs text-ink-muted hover:text-ink">
              Not now
            </button>
            <button onClick={dontNeedThis} className="text-xs text-ink-muted hover:text-ink" disabled={busy}>
              I don&rsquo;t need this
            </button>
          </div>
        </div>
        {error && (
          <div className="mx-auto max-w-content px-4 pb-2.5 sm:px-6">
            <Callout tone="critical">{error}</Callout>
          </div>
        )}
      </div>

      <ConfirmDialog
        open={confirmOpen}
        title="Import local data to the cloud?"
        confirmLabel={busy ? "Importing…" : "Import to cloud"}
        onConfirm={doImport}
        onCancel={() => setConfirmOpen(false)}
        body={
          preview && (
            <div className="space-y-3">
              <p>
                This replaces your household&rsquo;s starter content in the cloud with everything found on
                this device. A backup JSON file will download to your device first, and the local copy on
                this device is never deleted.
              </p>
              <ul className="grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-3 text-sm">
                {preview.counts.map((c) => (
                  <li key={c.label} className="flex justify-between gap-3">
                    <span className="text-ink-muted">{c.label}</span>
                    <span className="text-ink">{c.count}</span>
                  </li>
                ))}
              </ul>
              {error && <Callout tone="critical">{error}</Callout>}
            </div>
          )
        }
      />
    </>
  );
}
