"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ArrowLeft, Pause, Play, RefreshCw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataModeBadge } from "@/components/imports/DataModeBadge";
import { QueueStatusBadge } from "./QueueStatusBadge";
import { QueueProgressBar } from "./QueueProgressBar";
import { QueueTimeline } from "./QueueTimeline";
import { ExtractionRecordsTable } from "./ExtractionRecordsTable";
import {
  formatDuration,
  formatQueueDate,
  getQueuePlatformLabel,
  getQueuePriorityLabel,
} from "@/lib/services/queueService";
import type { QueueJobDetailData } from "@/lib/types/queue";

interface QueueDetailClientProps {
  initialData: QueueJobDetailData;
}

export function QueueDetailClient({ initialData }: QueueDetailClientProps) {
  const router = useRouter();
  const [data, setData] = useState(initialData);
  const [loading, setLoading] = useState(false);
  const { job, records, timeline, dataMode, firebaseConfigured } = data;

  async function runAction(action: string) {
    setLoading(true);
    try {
      await fetch(`/api/queue/${job.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const response = await fetch(`/api/queue/${job.id}`);
      const refreshed = (await response.json()) as QueueJobDetailData;
      setData(refreshed);
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          variant="ghost"
          size="sm"
          nativeButton={false}
          render={<Link href="/queue" />}
          className="gap-1.5 px-0 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" />
          Back to queue
        </Button>
        <DataModeBadge dataMode={dataMode} firebaseConfigured={firebaseConfigured} />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">{job.name}</h2>
            <QueueStatusBadge status={job.status} />
          </div>
          <p className="text-sm text-muted-foreground">
            {getQueuePlatformLabel(job.platform)} · {getQueuePriorityLabel(job.priority)} priority
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={() => runAction("pause")} disabled={loading}>
            <Pause className="size-4" />
            Pause
          </Button>
          <Button size="sm" variant="outline" onClick={() => runAction("resume")} disabled={loading}>
            <Play className="size-4" />
            Resume
          </Button>
          <Button size="sm" variant="outline" onClick={() => runAction("retry")} disabled={loading}>
            <RefreshCw className="size-4" />
            Retry
          </Button>
          <Button size="sm" variant="destructive" onClick={() => runAction("cancel")} disabled={loading}>
            <X className="size-4" />
            Cancel
          </Button>
        </div>
      </div>

      <QueueProgressBar
        percent={job.progressPercent}
        label={`${job.processedRecords.toLocaleString()} / ${job.estimatedRecords.toLocaleString()} records`}
        animated={job.status === "running" || job.status === "retrying"}
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Estimated" value={job.estimatedRecords.toLocaleString()} />
        <StatCard label="Processed" value={job.processedRecords.toLocaleString()} />
        <StatCard label="Successful" value={job.successfulRecords.toLocaleString()} />
        <StatCard label="Failed" value={job.failedRecords.toLocaleString()} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border bg-card shadow-none">
          <CardHeader>
            <CardTitle className="text-base font-semibold">Job Summary</CardTitle>
            <CardDescription>Extraction job metadata</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2 text-sm">
            <DetailRow label="Import Job" value={job.importJobName} />
            <DetailRow label="Worker Version" value={job.workerVersion} />
            <DetailRow label="Created" value={formatQueueDate(job.createdAt)} />
            <DetailRow label="Started" value={job.startedAt ? formatQueueDate(job.startedAt) : null} />
            <DetailRow label="Completed" value={job.completedAt ? formatQueueDate(job.completedAt) : null} />
            <DetailRow label="Duration" value={formatDuration(job.durationMs)} />
            {job.notes ? <DetailRow label="Notes" value={job.notes} /> : null}
          </CardContent>
        </Card>

        <QueueTimeline events={timeline} />
      </div>

      <Card className="border-border bg-card shadow-none">
        <CardHeader>
          <CardTitle className="text-base font-semibold">Extraction Records</CardTitle>
          <CardDescription>
            Individual profile URLs queued for future extraction — no extraction performed yet
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ExtractionRecordsTable records={records} />
        </CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <PlaceholderSection
          title="Worker Logs"
          description="Future phase — live worker output streamed to this panel."
        />
        <PlaceholderSection
          title="Console Output"
          description="Future phase — real-time extraction console for debugging."
        />
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <Card className="border-border bg-card shadow-none">
      <CardHeader className="pb-2">
        <CardDescription className="text-xs uppercase tracking-wide">{label}</CardDescription>
        <CardTitle className="text-2xl font-semibold">{value}</CardTitle>
      </CardHeader>
    </Card>
  );
}

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 sm:flex-row sm:gap-4">
      <span className="w-32 shrink-0 text-muted-foreground">{label}</span>
      <span className="text-foreground">{value ?? "—"}</span>
    </div>
  );
}

function PlaceholderSection({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Card className="border-dashed border-border bg-card/50 shadow-none">
      <CardHeader>
        <CardTitle className="text-base font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">Coming in a future phase.</p>
      </CardContent>
    </Card>
  );
}
