"use client";

import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import type { PipelineDashboardData } from "@/lib/types/pipeline";
import { PipelineSummaryCards } from "./PipelineSummaryCards";
import { PipelineTable } from "./PipelineTable";

type PipelineDashboardClientProps = PipelineDashboardData;

export function PipelineDashboardClient({
  stats,
  metrics,
  recentJobs,
  dataMode,
  firebaseConfigured,
  warning,
}: PipelineDashboardClientProps) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>
      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : warning ? (
        <FirestoreStatusBanner variant="warning" title="Mock Data" description={warning} />
      ) : null}

      <PipelineSummaryCards stats={stats} metrics={metrics} />
      <PipelineTable jobs={recentJobs} />
    </div>
  );
}
