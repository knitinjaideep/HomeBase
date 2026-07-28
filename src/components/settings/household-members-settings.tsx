"use client";

import { useState } from "react";
import { useHouseholdContext } from "@/lib/household/context";
import { generateFamilyInvite, revokeFamilyInvite } from "@/lib/household/api";
import { useHouseholdInvites, useHouseholdMembers } from "@/lib/hooks";
import { HOUSEHOLD_ROLE_LABELS } from "@/lib/labels";
import { expiresInLabel } from "@/lib/format";
import { Button, Callout, Chip, Panel } from "@/components/ui";
import { ConfirmDialog } from "@/components/modal";
import { useToast } from "@/components/toast";
import type { HouseholdInvite } from "@/lib/models";

export function HouseholdMembersSettings() {
  const { userEmail } = useHouseholdContext();
  const members = useHouseholdMembers();
  const invites = useHouseholdInvites();
  const { notify } = useToast();

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newCode, setNewCode] = useState<string | null>(null);
  const [revokeTarget, setRevokeTarget] = useState<HouseholdInvite | null>(null);

  const pendingInvites = (invites ?? []).filter((i) => !i.redeemedAt && !i.revokedAt);

  async function invite() {
    setError(null);
    setBusy(true);
    try {
      const code = await generateFamilyInvite();
      setNewCode(code);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate an invitation.");
    } finally {
      setBusy(false);
    }
  }

  async function copyCode() {
    if (!newCode) return;
    await navigator.clipboard.writeText(newCode);
    notify("Copied");
  }

  async function doRevoke() {
    if (!revokeTarget) return;
    setBusy(true);
    try {
      await revokeFamilyInvite(revokeTarget.id);
      notify("Invitation revoked");
    } catch (e) {
      notify(e instanceof Error ? e.message : "Could not revoke that invitation");
    } finally {
      setBusy(false);
      setRevokeTarget(null);
    }
  }

  return (
    <Panel className="p-5 sm:p-6">
      <h2 className="mb-2 font-display text-lg text-ink">Household members</h2>
      <p className="mb-4 text-sm text-ink-muted">
        Everyone below shares this household&rsquo;s HomeScope data — the same properties,
        finances, and journey progress, kept in sync across devices.
      </p>

      <ul className="divide-y divide-line">
        {members === undefined && <li className="py-3 text-sm text-ink-subtle">Loading…</li>}
        {members?.map((m) => (
          <li key={m.userId} className="flex items-center justify-between gap-3 py-3">
            <span className="text-sm text-ink">
              {m.email}
              {m.email === userEmail && <span className="text-ink-subtle"> (you)</span>}
            </span>
            <Chip tone={m.role === "owner" ? "accent" : "neutral"}>{HOUSEHOLD_ROLE_LABELS[m.role]}</Chip>
          </li>
        ))}
      </ul>

      {pendingInvites.length > 0 && (
        <div className="mt-4 border-t border-line pt-4">
          <h3 className="mb-2 text-sm font-medium text-ink">Pending invitations</h3>
          <ul className="divide-y divide-line">
            {pendingInvites.map((invite) => (
              <li key={invite.id} className="flex items-center justify-between gap-3 py-2">
                <span className="text-sm text-ink-muted">{expiresInLabel(invite.expiresAt)}</span>
                <button
                  onClick={() => setRevokeTarget(invite)}
                  className="text-xs text-critical hover:underline"
                >
                  Revoke
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}

      {newCode ? (
        <Callout tone="info" className="mt-4">
          <div className="space-y-2">
            <p>
              Share this code with your household member — it works once and expires in 24 hours.
              It won&rsquo;t be shown again.
            </p>
            <div className="flex items-center gap-3">
              <code className="rounded-md bg-surface px-3 py-1.5 font-mono text-base tracking-wide text-ink">
                {newCode}
              </code>
              <button onClick={copyCode} className="text-xs text-accent hover:underline">
                Copy
              </button>
            </div>
            <button onClick={() => setNewCode(null)} className="text-xs text-ink-subtle hover:text-ink">
              Done
            </button>
          </div>
        </Callout>
      ) : (
        <Button variant="secondary" onClick={invite} disabled={busy} className="mt-4">
          {busy ? "Generating…" : "Invite family member"}
        </Button>
      )}

      {error && (
        <Callout tone="critical" className="mt-3">
          {error}
        </Callout>
      )}

      <ConfirmDialog
        open={revokeTarget !== null}
        title="Revoke this invitation?"
        confirmLabel="Revoke"
        tone="critical"
        onConfirm={doRevoke}
        onCancel={() => setRevokeTarget(null)}
        body="The code will no longer work. This doesn't affect anyone who already joined."
      />
    </Panel>
  );
}
