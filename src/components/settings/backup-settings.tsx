"use client";

import { useRef, useState } from "react";
import { getDb } from "@/lib/db";
import {
  exportAll,
  hasSnapshot,
  parseBackup,
  readSnapshot,
  replaceAllData,
  snapshotBeforeImport,
  summarizeBackup,
} from "@/lib/backup";
import { removeSampleProperties, updateSettings } from "@/lib/repo";
import { dateLabel } from "@/lib/format";
import { useSettings } from "@/lib/hooks";
import { Button, Callout, Field, Panel, Select } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import type { Backup } from "@/lib/models";

export function BackupSettings() {
  const settings = useSettings();
  const { notify } = useToast();
  const fileInput = useRef<HTMLInputElement>(null);

  const [pending, setPending] = useState<Backup | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [confirmSamples, setConfirmSamples] = useState(false);
  const [busy, setBusy] = useState(false);

  const onFile = async (file: File) => {
    setImportError(null);
    const text = await file.text();
    const result = parseBackup(text);
    if (!result.ok) {
      setImportError(result.error);
      return;
    }
    setPending(result.backup);
  };

  const doImport = async () => {
    if (!pending) return;
    setBusy(true);
    try {
      await snapshotBeforeImport(getDb());
      await replaceAllData(getDb(), pending);
      notify("Data imported");
      setPending(null);
    } finally {
      setBusy(false);
    }
  };

  const restoreSnapshot = async () => {
    const snap = readSnapshot();
    if (!snap) return;
    setBusy(true);
    try {
      await replaceAllData(getDb(), snap);
      notify("Pre-import snapshot restored");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-2 font-display text-lg text-ink">Data & backups</h2>
      <p className="mb-4 text-sm text-ink-muted">
        Everything is stored only in this browser. Export a JSON backup regularly — it is your only
        copy. Nothing is uploaded anywhere.
      </p>

      <Callout tone="caution" className="mb-5">
        Browser storage is not a guaranteed-safe place. Clearing site data, some private-browsing
        modes, or moving to another device or browser will lose this data. Keep exported backups
        somewhere safe.
      </Callout>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-medium text-ink">Export</h3>
          <p className="mb-2 text-xs text-ink-subtle">
            {settings?.lastBackupAt
              ? `Last export: ${dateLabel(settings.lastBackupAt)}`
              : "No export yet."}
          </p>
          <Button
            variant="secondary"
            onClick={async () => {
              await exportAll(getDb());
              notify("Backup exported");
            }}
          >
            Export all data (JSON)
          </Button>
        </div>

        <div>
          <h3 className="mb-1 text-sm font-medium text-ink">Import</h3>
          <p className="mb-2 text-xs text-ink-subtle">
            Validated before anything is replaced. A local snapshot is taken automatically first.
          </p>
          <input
            ref={fileInput}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void onFile(file);
              e.target.value = "";
            }}
          />
          <Button variant="secondary" onClick={() => fileInput.current?.click()}>
            Choose backup file…
          </Button>
          {importError && (
            <Callout tone="critical" className="mt-2">
              {importError}
            </Callout>
          )}
          {hasSnapshot() && (
            <button
              onClick={restoreSnapshot}
              disabled={busy}
              className="mt-3 block text-xs text-accent hover:underline disabled:opacity-50"
            >
              Restore the last pre-import snapshot
            </button>
          )}
        </div>
      </div>

      <div className="mt-6 grid gap-6 border-t border-line pt-6 sm:grid-cols-2">
        <div>
          <h3 className="mb-1 text-sm font-medium text-ink">Appearance</h3>
          <Field label="Theme" className="max-w-[12rem]">
            <Select
              value={settings?.theme ?? "system"}
              onChange={(e) =>
                updateSettings({ theme: e.target.value as "light" | "dark" | "system" })
              }
            >
              <option value="system">System</option>
              <option value="light">Light</option>
              <option value="dark">Dark</option>
            </Select>
          </Field>
        </div>
        <div>
          <h3 className="mb-1 text-sm font-medium text-ink">Sample properties</h3>
          <p className="mb-2 text-xs text-ink-subtle">
            The three properties marked “SAMPLE” are examples. Remove them once you don&rsquo;t need
            them.
          </p>
          <Button variant="secondary" onClick={() => setConfirmSamples(true)}>
            Remove sample properties
          </Button>
        </div>
      </div>

      {/* Import preview / confirm */}
      <ConfirmDialog
        open={pending !== null}
        title="Replace all data with this backup?"
        confirmLabel={busy ? "Importing…" : "Replace everything"}
        tone="critical"
        onConfirm={doImport}
        onCancel={() => setPending(null)}
        body={
          pending && (
            <div className="space-y-3">
              <p>
                This <strong>replaces</strong> everything currently in this browser with the contents
                of the file (exported {dateLabel(pending.exportedAt)}). A local snapshot is saved
                first so you can roll back.
              </p>
              <ul className="grid grid-cols-2 gap-1 rounded-lg bg-surface-muted p-3 text-sm">
                {summarizeBackup(pending.data).map((s) => (
                  <li key={s.label} className="flex justify-between gap-3">
                    <span className="text-ink-muted">{s.label}</span>
                    <span className="text-ink">{s.count}</span>
                  </li>
                ))}
              </ul>
            </div>
          )
        }
      />

      {/* Remove samples confirm */}
      <ConfirmDialog
        open={confirmSamples}
        title="Remove sample properties?"
        confirmLabel="Remove samples"
        onConfirm={async () => {
          const n = await removeSampleProperties();
          setConfirmSamples(false);
          notify(n > 0 ? `Removed ${n} sample${n === 1 ? "" : "s"}` : "No samples to remove");
        }}
        onCancel={() => setConfirmSamples(false)}
        body="This deletes the example properties (and any notes on them). Your own properties are untouched."
      />
    </Panel>
  );
}
