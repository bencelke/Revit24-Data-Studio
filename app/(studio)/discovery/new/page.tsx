import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { NewCampaignPageClient } from "@/components/discovery/NewCampaignPageClient";
import { listDiscoveryTemplates } from "@/lib/services/discoveryService";

export const metadata: Metadata = {
  title: "New Discovery Campaign",
};

export default async function NewDiscoveryCampaignPage() {
  const templates = await listDiscoveryTemplates();

  return (
    <AppShell
      title="New Campaign"
      description="Build a discovery campaign with keywords, providers, and entity types"
    >
      <NewCampaignPageClient templates={templates} />
    </AppShell>
  );
}
