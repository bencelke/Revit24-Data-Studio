import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { PipelineDashboardClient } from "@/components/pipeline";
import { getPipelineDashboardData } from "@/lib/services/pipelineService";

export const metadata: Metadata = {
  title: "Import Pipeline",
};

export default async function PipelinePage() {
  const data = await getPipelineDashboardData();

  return (
    <AppShell
      title="Import Pipeline"
      description="Unified end-to-end pipeline — every provider follows the same lifecycle"
    >
      <PipelineDashboardClient {...data} />
    </AppShell>
  );
}
