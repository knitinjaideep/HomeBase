"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useOwnedHome } from "@/lib/hooks";
import { convertPropertyToOwnedHome } from "@/lib/purchase/service";
import { Overlay } from "@/components/modal";
import { Button, Callout, Field, Input, Toggle } from "@/components/ui";
import { StarterTemplatePicker } from "@/components/maintenance/starter-template-picker";
import { useToast } from "@/components/toast";
import { money } from "@/lib/format";
import type { Deal, Property } from "@/lib/models";

/**
 * The confirmation flow for promoting a candidate home into the owned-home
 * record — see src/lib/purchase/service.ts for what actually gets written.
 * A short form, not a wizard: everything here is either already decided (the
 * property being converted) or optional.
 */
export function ConvertToHomeownerDialog({
  open,
  onClose,
  property,
  deal,
}: {
  open: boolean;
  onClose: () => void;
  property: Property;
  deal?: Deal;
}) {
  const router = useRouter();
  const { notify } = useToast();
  const ownedHome = useOwnedHome();

  const [step, setStep] = useState<"form" | "starter-templates">("form");
  const [closingDate, setClosingDate] = useState(deal?.postClosing.closingDate ?? "");
  const [moveInDate, setMoveInDate] = useState("");
  const [finalPurchasePrice, setFinalPurchasePrice] = useState(
    property.finalSalePrice != null ? String(property.finalSalePrice) : "",
  );
  const [switchMode, setSwitchMode] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const reset = () => {
    setStep("form");
    setBusy(false);
    setError(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const willReplaceExistingHome =
    Boolean(ownedHome) && ownedHome!.sourcePropertyId != null && ownedHome!.sourcePropertyId !== property.id;

  const submit = async () => {
    if (!closingDate) {
      setError("Closing date is required.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const result = await convertPropertyToOwnedHome(property.id, {
        closingDate,
        moveInDate: moveInDate || null,
        finalPurchasePrice: finalPurchasePrice ? Number(finalPurchasePrice) : null,
        switchMode,
      });
      if (result.modeChanged) {
        setStep("starter-templates");
      } else {
        notify("Marked as purchased");
        handleClose();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const finishAfterConversion = () => {
    reset();
    onClose();
    notify("Purchase recorded — welcome to HomeBase!");
    router.push("/homebase");
  };

  return (
    <Overlay open={open} onClose={handleClose} title="I bought this home" size="md">
      {step === "starter-templates" ? (
        <div className="p-5">
          <p className="mb-4 text-sm text-ink-muted">
            Optional: pick a few recurring maintenance tasks to start with. You can always add more later.
          </p>
          <StarterTemplatePicker onDone={finishAfterConversion} />
        </div>
      ) : (
        <div className="space-y-5 p-5">
          <p className="text-sm text-ink-muted">
            You&apos;re about to mark <strong className="text-ink">{property.address}</strong> as purchased and set
            it as your HomeBase home.
          </p>

          {willReplaceExistingHome && (
            <Callout tone="caution">
              You already have a HomeBase home linked to a different property. Confirming will replace it with{" "}
              {property.address}.
            </Callout>
          )}

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Closing date">
              <Input type="date" value={closingDate} onChange={(e) => setClosingDate(e.target.value)} />
            </Field>
            <Field label="Move-in date (optional)">
              <Input type="date" value={moveInDate} onChange={(e) => setMoveInDate(e.target.value)} />
            </Field>
            <Field label="Final purchase price (optional)" className="sm:col-span-2">
              <Input
                type="number"
                value={finalPurchasePrice}
                onChange={(e) => setFinalPurchasePrice(e.target.value)}
                placeholder="e.g. 650000"
              />
            </Field>
          </div>

          <Field label="">
            <Toggle checked={switchMode} onChange={setSwitchMode} label="Switch to homeowner mode now" />
            <span className="mt-1 block text-xs text-ink-subtle">
              You can change this later in Settings → Change path.
            </span>
          </Field>

          <Callout tone="neutral">
            This will mark the home purchased, create your HomeBase profile
            {finalPurchasePrice ? ` at ${money(Number(finalPurchasePrice))}` : ""}, and keep every visit, note,
            document, and offer record exactly where it is.
            {switchMode
              ? " Your workspace will switch to homeowner mode."
              : " Your workspace will stay in buying mode."}
          </Callout>

          {error && <Callout tone="critical">{error}</Callout>}

          <div className="flex justify-end gap-3">
            <button
              onClick={handleClose}
              className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
            >
              Cancel
            </button>
            <Button onClick={submit} disabled={busy}>
              {busy ? "Confirming…" : "Confirm purchase"}
            </Button>
          </div>
        </div>
      )}
    </Overlay>
  );
}
