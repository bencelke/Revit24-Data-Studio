import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import {
  DiscoveryJobsTable,
  DiscoveryPageNav,
  DiscoveryResultsTable,
  DiscoveryTimeline,
} from "@/components/discovery";
import { getDiscoveryHistoryData } from "@/lib/services/discoveryService";

export const metadata: Metadata = {
  title: "Discovery History",
};

export default async function DiscoveryHistoryPage() {
  const { jobs, results } = await getDiscoveryHistoryData();

  return (
    <AppShell title="Discovery History" description="Completed discovery jobs and results">
      <div className="space-y-8">
        <DiscoveryPageNav active="/discovery/history" />
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Completed Jobs</h2>
          <DiscoveryJobsTable jobs={jobs} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">Timeline</h2>
          <DiscoveryTimeline jobs={jobs} />
        </section>
        <section className="space-y-3">
          <h2 className="text-lg font-semibold">All Results</h2>
          <DiscoveryResultsTable results={results} />
        </section>
      </div>
    </AppShell>
  );
}
