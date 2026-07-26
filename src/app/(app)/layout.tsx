import { HouseholdProvider } from "@/lib/household/context";
import { AppShell } from "@/components/app-shell";

/** Every authenticated page: bootstraps the household, then the nav chrome. */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <HouseholdProvider>
      <AppShell>{children}</AppShell>
    </HouseholdProvider>
  );
}
