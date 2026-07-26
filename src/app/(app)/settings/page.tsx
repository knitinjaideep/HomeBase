"use client";

import { useFinancial, useHousehold, usePreferences } from "@/lib/hooks";
import { PageHeader } from "@/components/ui";
import { HouseholdSettings } from "@/components/settings/household-settings";
import { FinancialSettings } from "@/components/settings/financial-settings";
import { PreferencesSettings } from "@/components/settings/preferences-settings";
import { BackupSettings } from "@/components/settings/backup-settings";

export default function SettingsPage() {
  const household = useHousehold();
  const financial = useFinancial();
  const preferences = usePreferences();

  if (!household || !financial || !preferences) {
    return <div className="text-ink-subtle">Loading…</div>;
  }

  return (
    <div>
      <PageHeader
        title="Settings"
        description="Your household, finances, and preferences — used everywhere an estimate appears."
      />
      <div className="space-y-6">
        <HouseholdSettings profile={household} />
        <FinancialSettings profile={financial} />
        <PreferencesSettings preferences={preferences} />
        <BackupSettings />
      </div>
    </div>
  );
}
