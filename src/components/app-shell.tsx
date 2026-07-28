"use client";

import { useActiveMode } from "@/lib/workspace/mode-context";
import { AppNav } from "./app-nav";
import { BottomNav } from "./bottom-nav";
import { BackupReminder } from "./backup-reminder";
import { MigrationBanner } from "./migration-banner";

/**
 * Frame around every page: navigation, the backup reminder, and a footer
 * note. Reads the mode WorkspaceGate already resolved (via `useActiveMode`,
 * never a fresh fetch — see mode-context.tsx for why that distinction avoids
 * a hydration flicker) and passes it down to AppNav/BottomNav, and sets
 * `data-mode` on the root element so the mode-accent CSS custom properties
 * (globals.css) cascade to the nav's active-item styling without recoloring
 * the rest of the shell.
 */
export function AppShell({ children }: { children: React.ReactNode }) {
  const mode = useActiveMode();

  return (
    <div
      data-mode={mode}
      className="flex min-h-screen flex-col"
      style={{ paddingLeft: "env(safe-area-inset-left)", paddingRight: "env(safe-area-inset-right)" }}
    >
      <AppNav mode={mode} />
      <MigrationBanner />
      <BackupReminder />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
        {children}
      </main>
      <footer className="no-print hidden border-t border-line md:block">
        <div className="mx-auto max-w-content px-4 py-6 text-xs leading-relaxed text-ink-subtle sm:px-6">
          <p>
            HomeScope stores your household&rsquo;s data in your private Supabase database — nothing is
            shared outside your household. Export a backup regularly as your own independent copy.
          </p>
          <p className="mt-2">All figures are estimates for personal planning, not professional advice.</p>
        </div>
      </footer>
      <BottomNav mode={mode} />
    </div>
  );
}
