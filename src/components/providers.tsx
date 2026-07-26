"use client";

import { useEffect, useState } from "react";
import { applyTheme, useTheme } from "@/lib/theme";
import { ToastProvider } from "./toast";

/** Keeps the applied theme in sync with the stored preference and the OS. */
function ThemeSync() {
  const [theme] = useTheme();

  useEffect(() => {
    applyTheme(theme);
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const listener = () => applyTheme("system");
    mq.addEventListener("change", listener);
    return () => mq.removeEventListener("change", listener);
  }, [theme]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  // Identical output on the server and the first client render (avoids mismatch).
  if (!mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="animate-fade-in text-ink-subtle">Loading your HomeScope…</div>
      </div>
    );
  }

  return (
    <ToastProvider>
      <ThemeSync />
      {children}
    </ToastProvider>
  );
}
