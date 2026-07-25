import { AppNav } from "./app-nav";
import { BottomNav } from "./bottom-nav";
import { BackupReminder } from "./backup-reminder";

/** Frame around every page: navigation, the backup reminder, and a footer note. */
export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <AppNav />
      <BackupReminder />
      <main className="mx-auto w-full max-w-content flex-1 px-4 py-8 pb-24 sm:px-6 sm:py-10 md:pb-10">
        {children}
      </main>
      <footer className="no-print hidden border-t border-line md:block">
        <div className="mx-auto max-w-content px-4 py-6 text-xs leading-relaxed text-ink-subtle sm:px-6">
          <p>
            HomeScope keeps everything on this device, in your browser&rsquo;s local storage — nothing is
            uploaded, and clearing site data can lose it. Export a backup regularly.
          </p>
          <p className="mt-2">All figures are estimates for personal planning, not professional advice.</p>
        </div>
      </footer>
      <BottomNav />
    </div>
  );
}
