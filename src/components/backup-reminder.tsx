"use client";

import { useState } from "react";
import { useSettings } from "@/lib/hooks";
import { exportAll } from "@/lib/backup";
import { getDb } from "@/lib/db";
import { dateLabel } from "@/lib/format";
import { useToast } from "./toast";

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;

/**
 * A calm reminder to export a backup. Appears when no backup exists yet or the
 * last one is over two weeks old. Data lives only in this browser, so a periodic
 * export is the user's safety net.
 */
export function BackupReminder() {
  const settings = useSettings();
  const { notify } = useToast();
  const [dismissed, setDismissed] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!settings || dismissed) return null;

  const last = settings.lastBackupAt ? new Date(settings.lastBackupAt).getTime() : null;
  const stale = last === null || Date.now() - last > FOURTEEN_DAYS;
  if (!stale) return null;

  const handleExport = async () => {
    setBusy(true);
    try {
      await exportAll(getDb());
      notify("Backup exported");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="no-print border-b border-caution/30 bg-caution/10">
      <div className="mx-auto flex max-w-content flex-col gap-2 px-4 py-2.5 text-sm sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="text-ink">
          {last === null
            ? "Your data lives only in this browser. Export a backup to keep it safe."
            : `Last backup ${dateLabel(settings.lastBackupAt)}. A fresh export is a good idea.`}
        </p>
        <div className="flex shrink-0 items-center gap-3">
          <button
            onClick={handleExport}
            disabled={busy}
            className="rounded-lg bg-accent px-3 py-1.5 text-xs font-medium text-white hover:opacity-90 disabled:opacity-50"
          >
            {busy ? "Exporting…" : "Export backup"}
          </button>
          <button
            onClick={() => setDismissed(true)}
            className="text-xs text-ink-muted hover:text-ink"
          >
            Later
          </button>
        </div>
      </div>
    </div>
  );
}
