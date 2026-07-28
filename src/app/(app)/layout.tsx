import { HouseholdProvider } from "@/lib/household/context";
import { AppShell } from "@/components/app-shell";
import { WorkspaceGate } from "@/components/workspace/workspace-gate";

/**
 * Every authenticated page: bootstraps the household, gates on path selection
 * (a user with no mode chosen sees the landing/onboarding instead of the app),
 * then the nav chrome.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdProvider>
      <WorkspaceGate>
        <AppShell>{children}</AppShell>
      </WorkspaceGate>
    </HouseholdProvider>
  );
}
