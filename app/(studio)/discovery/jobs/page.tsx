import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { DiscoveryJobsTable, DiscoveryPageNav } from "@/components/discovery";
import { getDiscoveryJobListResult } from "@/lib/services/discoveryService";

export const metadata: Metadata = {
  title: "Discovery Jobs",
};

export default async function DiscoveryJobsPage() {
  const { jobs } = await getDiscoveryJobListResult(1, 50);

  return (
    <AppShell title="Discovery Jobs" description="Campaign discovery job execution">
      <div className="space-y-6">
        <DiscoveryPageNav active="/discovery/jobs" />
        <DiscoveryJobsTable jobs={jobs} />
      </div>
    </AppShell>
  );
}
