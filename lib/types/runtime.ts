import type { ExtractionJobDocument } from "./queue";

export interface LiveJobProgress {
  jobId: string;
  jobName: string;
  status: ExtractionJobDocument["status"];
  progressPercent: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  remainingRecords: number;
  estimatedRecords: number;
  estimatedRemainingSeconds: number | null;
  currentProfile: string | null;
  lastProcessedProfile: string | null;
  claimedByWorkerId: string | null;
}
