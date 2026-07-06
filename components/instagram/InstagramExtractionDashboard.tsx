"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { InstagramExtractionStatusCard } from "./InstagramExtractionStatusCard";
import { InstagramExtractionProgress } from "./InstagramExtractionProgress";
import { InstagramExtractionErrors } from "./InstagramExtractionErrors";
import type { InstagramExtractionDashboardData } from "@/lib/types/instagram-profiles";

type InstagramExtractionDashboardProps = InstagramExtractionDashboardData;

export function InstagramExtractionDashboard({
  extractionEnabled,
  useMock,
  activeJobs,
  stats,
  progress,
  workerStatus,
  firebaseConfigured,
  dataMode,
}: InstagramExtractionDashboardProps) {
  const [liveStats, setLiveStats] = useState(stats);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      const response = await fetch("/api/queue/live");
      if (response.ok) {
        const data = (await response.json()) as {
          jobs: Array<{
            estimatedRecords: number;
            processedRecords: number;
            successfulRecords: number;
            failedRecords: number;
            duplicateRecords: number;
            platform: string;
          }>;
        };
        const instagram = data.jobs.filter((job) => job.platform === "instagram");
        setLiveStats((current) => ({
          totalQueued: instagram.reduce((sum, job) => sum + job.estimatedRecords, 0),
          processed: instagram.reduce((sum, job) => sum + job.processedRecords, 0),
          successful: instagram.reduce((sum, job) => sum + job.successfulRecords, 0),
          failed: instagram.reduce((sum, job) => sum + job.failedRecords, 0),
          duplicates: instagram.reduce((sum, job) => sum + job.duplicateRecords, 0),
          rateLimited: current.rateLimited,
        }));
      }
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => void refresh(), 10_000);
    return () => clearInterval(timer);
  }, [refresh]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => void refresh()} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 size-4 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="secondary" size="sm" nativeButton={false} render={<Link href="/queue" />}>
            Open Queue
          </Button>
          <Button
            variant="secondary"
            size="sm"
            nativeButton={false}
            render={<Link href="/imports/new/instagram" />}
          >
            Bulk Import
          </Button>
        </div>
      </div>

      {!extractionEnabled ? (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
          Instagram extraction is disabled. Set <code>ENABLE_INSTAGRAM_EXTRACTION=true</code> to
          enable live public metadata extraction. Mock data is used when disabled.
        </div>
      ) : useMock ? (
        <div className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Running in mock extraction mode.
        </div>
      ) : null}

      <InstagramExtractionStatusCard
        data={{ extractionEnabled, useMock, workerStatus, firebaseConfigured, dataMode }}
      />

      <InstagramExtractionProgress progress={progress} stats={liveStats} />

      <InstagramExtractionErrors jobs={activeJobs} />

      {activeJobs.length > 0 ? (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold">Active Jobs</h3>
          <ul className="space-y-2 text-sm">
            {activeJobs.map((job) => (
              <li
                key={job.id}
                className="flex items-center justify-between rounded-lg border border-border px-3 py-2"
              >
                <span>
                  {job.name} — {job.processedRecords}/{job.estimatedRecords}
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  nativeButton={false}
                  render={<Link href={`/queue/${job.id}`} />}
                >
                  View
                </Button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
