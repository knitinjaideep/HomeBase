"use client";

import { createContext, useCallback, useContext, useMemo, useRef, useState } from "react";

interface ToastState {
  id: number;
  message: string;
  tone: "default" | "positive";
}

interface ToastContextValue {
  /** Show a brief confirmation, e.g. after a save. */
  notify: (message: string, tone?: "default" | "positive") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const counter = useRef(0);

  const notify = useCallback((message: string, tone: "default" | "positive" = "positive") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, tone }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 2600);
  }, []);

  const value = useMemo(() => ({ notify }), [notify]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        className="no-print pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4"
        aria-live="polite"
        role="status"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className="animate-toast pointer-events-auto flex items-center gap-2 rounded-full border border-line bg-surface px-4 py-2 text-sm text-ink shadow-lg"
          >
            <span
              className={
                t.tone === "positive"
                  ? "inline-block h-2 w-2 rounded-full bg-positive"
                  : "inline-block h-2 w-2 rounded-full bg-accent"
              }
              aria-hidden
            />
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}
