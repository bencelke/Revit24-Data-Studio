import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { QueueDashboardClient, QueuePageNav } from "@/components/queue";
import { getQueueDashboardData } from "@/lib/services/queueService";
import { getLiveQueueProgress } from "@/lib/services/workerRuntimeService";

export const metadata: Metadata = {
  title: "Extraction Queue",
};

export default async function QueuePage() {
  const [data, liveJobs] = await Promise.all([
    getQueueDashboardData(),
    getLiveQueueProgress(),
  ]);

  return (
    <AppShell
      title="Extraction Queue"
      description="Manage extraction jobs — GitHub Actions for data collection"
    >
      <div className="space-y-6">
        <QueuePageNav active="overview" />
        <QueueDashboardClient
          stats={data.stats}
          initialJobs={data.jobs}
          initialLiveJobs={liveJobs}
          dataMode={data.dataMode}
          firebaseConfigured={data.firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
