"use client";

import { useEffect, useState } from "react";
import { getDb } from "@/lib/db";
import { ensureSeeded } from "@/lib/seed";
import { useSettings } from "@/lib/hooks";
import { ToastProvider } from "./toast";

const THEME_KEY = "homescope:theme";

function applyTheme(theme: "light" | "dark" | "system") {
  const prefersDark =
    typeof window !== "undefined" && window.matchMedia("(prefers-color-scheme: dark)").matches;
  const dark = theme === "dark" || (theme === "system" && prefersDark);
  document.documentElement.classList.toggle("dark", dark);
}

/** Keeps the applied theme in sync with the stored preference and the OS. */
function ThemeSync() {
  const settings = useSettings();
  const theme = settings?.theme ?? "system";

  useEffect(() => {
    applyTheme(theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
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
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setMounted(true);
    ensureSeeded(getDb())
      .then(() => setReady(true))
      .catch((e) => setError(e instanceof Error ? e.message : "Could not open local storage."));
  }, []);

  // Identical output on the server and the first client render (avoids mismatch).
  if (!mounted) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <div className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
        <h1 className="font-display text-2xl text-ink">HomeScope could not start</h1>
        <p className="text-ink-muted">{error}</p>
        <p className="text-sm text-ink-subtle">
          This app stores data in your browser. Private-browsing windows or blocked storage can
          prevent it from opening.
        </p>
      </div>
    );
  }

  if (!ready) {
    return <LoadingScreen />;
  }

  return (
    <ToastProvider>
      <ThemeSync />
      {children}
    </ToastProvider>
  );
}

function LoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="animate-fade-in text-ink-subtle">Loading your HomeScope…</div>
    </div>
  );
}
