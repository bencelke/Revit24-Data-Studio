"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { WorkerStatusCard } from "./WorkerStatusCard";
import { WorkerRuntimeTable } from "./WorkerRuntimeTable";
import { LiveQueueProgress } from "./LiveQueueProgress";
import type { LiveJobProgress } from "@/lib/types/runtime";
import type { WorkerDocument } from "@/lib/types/workers";
import type { ImportDataMode } from "@/lib/types/import-jobs";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";

interface WorkersRuntimeClientProps {
  initialWorkers: WorkerDocument[];
  initialLiveJobs: LiveJobProgress[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export function WorkersRuntimeClient({
  initialWorkers,
  initialLiveJobs,
  dataMode,
  firebaseConfigured,
}: WorkersRuntimeClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshWorkers() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/workers");
      if (response.ok) {
        const data = (await response.json()) as { workers: WorkerDocument[] };
        setWorkers(data.workers);
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      void refreshWorkers();
    }, 10_000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        <Button variant="secondary" size="sm" onClick={() => void refreshWorkers()} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh Workers
        </Button>
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner
          variant="warning"
          title="Mock Mode"
          description={MOCK_MODE_WARNING}
        />
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {workers.map((worker) => (
          <WorkerStatusCard key={worker.id} worker={worker} />
        ))}
      </div>

      <WorkerRuntimeTable workers={workers} />

      <LiveQueueProgress initialJobs={initialLiveJobs} />
    </div>
  );
}
