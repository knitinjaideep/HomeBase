"use client";

import { useEffect } from "react";
import { cn } from "@/lib/util";

interface OverlayProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Presentation: a centered modal or a right-side drawer. */
  variant?: "modal" | "drawer";
  /** Max width for the modal variant. */
  size?: "md" | "lg" | "xl";
}

const SIZES: Record<NonNullable<OverlayProps["size"]>, string> = {
  md: "max-w-lg",
  lg: "max-w-2xl",
  xl: "max-w-4xl",
};

/** A dialog used for both centered modals and right-hand drawers. Escape closes. */
export function Overlay({
  open,
  onClose,
  title,
  children,
  variant = "modal",
  size = "lg",
}: OverlayProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="no-print fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label={title}>
      <button
        aria-label="Close"
        onClick={onClose}
        className="animate-fade-in absolute inset-0 h-full w-full cursor-default bg-ink/30 backdrop-blur-[1px]"
      />
      {variant === "drawer" ? (
        <div className="ml-auto flex h-full w-full max-w-xl">
          <div className="animate-slide-in-right relative flex h-full w-full flex-col overflow-hidden border-l border-line bg-surface shadow-2xl">
            {title && <OverlayHeader title={title} onClose={onClose} />}
            <div className="hs-scroll flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      ) : (
        <div className="relative m-auto flex max-h-[92vh] w-full flex-col px-4 py-6">
          <div
            className={cn(
              "animate-scale-in mx-auto flex max-h-[88vh] w-full flex-col overflow-hidden rounded-xl border border-line bg-surface shadow-2xl",
              SIZES[size],
            )}
          >
            {title && <OverlayHeader title={title} onClose={onClose} />}
            <div className="hs-scroll flex-1 overflow-y-auto">{children}</div>
          </div>
        </div>
      )}
    </div>
  );
}

function OverlayHeader({ title, onClose }: { title: string; onClose: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-line bg-surface px-5 py-4">
      <h2 className="font-display text-lg text-ink">{title}</h2>
      <button
        onClick={onClose}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-ink-muted hover:bg-surface-muted hover:text-ink"
        aria-label="Close"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 6 6 18M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  body: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: "default" | "critical";
  onConfirm: () => void;
  onCancel: () => void;
}

/** A small confirmation used before destructive or irreversible actions. */
export function ConfirmDialog({
  open,
  title,
  body,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "default",
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Overlay open={open} onClose={onCancel} title={title} size="md">
      <div className="space-y-5 p-5">
        <div className="text-sm leading-relaxed text-ink-muted">{body}</div>
        <div className="flex justify-end gap-3">
          <button
            onClick={onCancel}
            className="rounded-lg border border-line px-4 py-2 text-sm font-medium text-ink hover:bg-surface-muted"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium text-white",
              tone === "critical" ? "bg-critical hover:opacity-90" : "bg-accent hover:opacity-90",
            )}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </Overlay>
  );
}
