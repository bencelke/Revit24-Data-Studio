import type { Metadata } from "next";
import { AppShell } from "@/components/layout";
import { QueuePageNav, WorkersClient } from "@/components/queue";
import { getWorkersPageData } from "@/lib/services/workerService";

export const metadata: Metadata = {
  title: "Workers",
};

export default async function WorkersPage() {
  const data = await getWorkersPageData();

  return (
    <AppShell
      title="Workers"
      description="Extraction worker fleet — architecture preview with mock data"
    >
      <div className="space-y-6">
        <QueuePageNav active="workers" />
        <WorkersClient
          workers={data.workers}
          dataMode={data.dataMode}
          firebaseConfigured={data.firebaseConfigured}
        />
      </div>
    </AppShell>
  );
}
