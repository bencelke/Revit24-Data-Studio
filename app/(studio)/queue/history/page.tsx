import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { QueueHistoryClient, QueuePageNav } from "@/components/queue";
import { getQueueDashboardData } from "@/lib/services/queueService";

export const metadata: Metadata = {
  title: "Queue History",
};

export default async function QueueHistoryPage() {
  const data = await getQueueDashboardData();

  return (
    <AppShell
      title="Queue History"
      description="Completed, failed, and cancelled extraction jobs"
    >
      <div className="space-y-6">
        <QueuePageNav active="history" />
        <QueueHistoryClient
          initialJobs={data.jobs}
          dataMode={data.dataMode}
          firebaseConfigured={data.firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
