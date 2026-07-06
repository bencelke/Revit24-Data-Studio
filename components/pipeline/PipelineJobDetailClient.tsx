"use client";

import { DataModeBadge, FirestoreStatusBanner } from "@/components/imports/DataModeBadge";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import type { PipelineJobDetailData } from "@/lib/types/pipeline";
import {
  formatPipelineProvider,
  formatPipelineStage,
  formatPipelineStatus,
} from "@/lib/services/pipelineService";
import { PipelineProgress } from "./PipelineProgress";
import { PipelineVisualizer } from "./PipelineVisualizer";
import { PipelineTimeline } from "./PipelineTimeline";
import { PipelineEventsTable } from "./PipelineEventsTable";
import { PipelineStatusBadge } from "./PipelineStatusBadge";

type PipelineJobDetailClientProps = PipelineJobDetailData;

export function PipelineJobDetailClient({
  job,
  events,
  estimatedRemainingMs,
  dataMode,
  firebaseConfigured,
}: PipelineJobDetailClientProps) {
  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
        <PipelineStatusBadge status={job.status} />
      </div>

      {!firebaseConfigured ? (
        <FirestoreStatusBanner variant="warning" title="Mock Mode" description={MOCK_MODE_WARNING} />
      ) : null}

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">{formatPipelineProvider(job.provider)} Pipeline</h2>
        <p className="text-sm text-muted-foreground">
          {formatPipelineStage(job.currentStage)} · {formatPipelineStatus(job.status)}
        </p>
      </div>

      <PipelineProgress job={job} estimatedRemainingMs={estimatedRemainingMs} />
      <PipelineVisualizer job={job} />

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Timeline
          </h3>
          <PipelineTimeline events={events} />
        </div>
        <div className="space-y-3">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Events
          </h3>
          <PipelineEventsTable events={events} />
        </div>
      </div>
    </div>
  );
}
