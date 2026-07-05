import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { QueuePageNav, WorkerLogsClient } from "@/components/queue";
import { getWorkerLogsPageData } from "@/lib/services/workerService";

export const metadata: Metadata = {
  title: "Worker Logs",
};

export default async function WorkerLogsPage() {
  const data = await getWorkerLogsPageData();

  return (
    <AppShell
      title="Worker Logs"
      description="Searchable extraction worker event logs"
    >
      <div className="space-y-6">
        <QueuePageNav active="logs" />
        <WorkerLogsClient
          initialLogs={data.logs}
          workers={data.workers}
          dataMode={data.dataMode}
          firebaseConfigured={data.firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
