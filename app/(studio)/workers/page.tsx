import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { QueuePageNav } from "@/components/queue";
import { WorkersRuntimeClient } from "@/components/workers";
import { getWorkersRuntimePageData } from "@/lib/services/workerRuntimeService";

export const metadata: Metadata = {
  title: "Workers",
};

export default async function WorkersPage() {
  const data = await getWorkersRuntimePageData();

  return (
    <AppShell
      title="Workers"
      description="Live worker fleet — heartbeats, job processing, and runtime status"
    >
      <div className="space-y-6">
        <QueuePageNav active="workers" />
        <WorkersRuntimeClient
          initialWorkers={data.workers}
          initialLiveJobs={data.liveJobs}
          dataMode={data.dataMode}
          firebaseConfigured={data.firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
