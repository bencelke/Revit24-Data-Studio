import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { SimpleSettingsPanel } from "@/components/settings/SimpleSettingsPanel";
import { getSimpleSettingsData } from "@/lib/services/simpleInstagramImportService";

export const metadata: Metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  const settings = await getSimpleSettingsData();

  return (
    <AppShell
      title="Settings"
      description="App configuration and extraction behavior"
    >
      <SimpleSettingsPanel settings={settings} />
    </AppShell>
  );
}
