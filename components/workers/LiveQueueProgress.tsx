"use client";

import { useEffect, useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { WorkerProgressCard } from "./WorkerProgressCard";
import type { LiveJobProgress } from "@/lib/types/runtime";

interface LiveQueueProgressProps {
  initialJobs: LiveJobProgress[];
  refreshIntervalMs?: number;
}

export function LiveQueueProgress({
  initialJobs,
  refreshIntervalMs = 10_000,
}: LiveQueueProgressProps) {
  const [jobs, setJobs] = useState(initialJobs);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  async function refresh() {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/queue/live");
      if (response.ok) {
        const data = (await response.json()) as { jobs: LiveJobProgress[] };
        setJobs(data.jobs);
        setLastUpdated(new Date());
      }
    } finally {
      setIsRefreshing(false);
    }
  }

  useEffect(() => {
    const timer = setInterval(() => {
      void refresh();
    }, refreshIntervalMs);
    return () => clearInterval(timer);
  }, [refreshIntervalMs]);

  const activeJobs = jobs.filter((job) =>
    ["queued", "running", "retrying", "paused"].includes(job.status),
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold">Live Queue Progress</h3>
          <p className="text-xs text-muted-foreground">
            Auto-refreshes every {refreshIntervalMs / 1000}s
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : null}
          </p>
        </div>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={isRefreshing}>
          <RefreshCw className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      {activeJobs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No active extraction jobs.</p>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {activeJobs.map((job) => (
            <WorkerProgressCard key={job.jobId} progress={job} />
          ))}
        </div>
      )}
    </div>
  );
}
