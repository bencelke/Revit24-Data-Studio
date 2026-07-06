import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { ExtractorSettingsPanel } from "@/components/settings/ExtractorSettingsPanel";
import { getExtractorSettingsData } from "@/lib/services/instagramPublicExtractorService";

export const metadata: Metadata = {
  title: "Settings",
};

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const settings = await getExtractorSettingsData();

  return (
    <AppShell
      title="Settings"
      description="Extractor configuration and behavior"
    >
      <ExtractorSettingsPanel settings={settings} />
    </AppShell>
  );
}
