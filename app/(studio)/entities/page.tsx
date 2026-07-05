import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { EntitiesDashboardClient } from "@/components/entities";
import { getEntitiesListData } from "@/lib/services/normalizationPipeline";

export const metadata: Metadata = {
  title: "Entities",
};

export default async function EntitiesPage() {
  const data = await getEntitiesListData();

  return (
    <AppShell
      title="Entities"
      description="Normalized automotive records awaiting review and enrichment"
    >
      <EntitiesDashboardClient
        stats={data.stats}
        initialRecords={data.records}
        dataMode={data.dataMode}
        firebaseConfigured={data.firebaseConfigured}
      />
    </AppShell>
  );
}
