import type { ExtractionJobDocument, ExtractionRecordDocument } from "@/lib/types/queue";
import type { LiveJobProgress } from "@/lib/types/runtime";
import type { QueueExtractionProgress } from "@/lib/types/instagram-profiles";
import { calculateProgress } from "@/lib/types/queue";

const AVG_SECONDS_PER_PROFILE = 3;

export type { LiveJobProgress };

export function buildLiveJobProgress(
  job: ExtractionJobDocument,
  records: ExtractionRecordDocument[],
): LiveJobProgress {
  const extractionProgress = computeRecordProgress(job, records);

  return {
    jobId: job.id,
    jobName: job.name,
    status: job.status,
    progressPercent: calculateProgress(job.processedRecords, job.estimatedRecords),
    processedRecords: job.processedRecords,
    successfulRecords: job.successfulRecords,
    failedRecords: job.failedRecords,
    remainingRecords: extractionProgress.remaining,
    estimatedRecords: job.estimatedRecords,
    estimatedRemainingSeconds: extractionProgress.estimatedRemainingSeconds,
    currentProfile: extractionProgress.currentProfile,
    lastProcessedProfile: extractionProgress.lastProcessedProfile,
    claimedByWorkerId: job.claimedByWorkerId,
  };
}

export function computeRecordProgress(
  job: ExtractionJobDocument,
  records: ExtractionRecordDocument[],
): QueueExtractionProgress {
  const running = records.find((record) => record.status === "running");
  const completedRecords = records.filter(
    (record) => record.status === "completed" || record.status === "failed",
  );
  const lastProcessed = completedRecords.sort((a, b) => {
    const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0;
    const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0;
    return bTime - aTime;
  })[0];

  const remaining = Math.max(0, job.estimatedRecords - job.processedRecords);

  return {
    currentProfile: running?.username ? `@${running.username}` : null,
    lastProcessedProfile: lastProcessed?.username ? `@${lastProcessed.username}` : null,
    successful: job.successfulRecords,
    failed: job.failedRecords,
    remaining,
    estimatedRemainingSeconds:
      remaining > 0 ? remaining * AVG_SECONDS_PER_PROFILE : null,
  };
}

export function formatEstimatedRemaining(seconds: number | null): string {
  if (seconds == null || seconds <= 0) return "—";
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.ceil(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
}
