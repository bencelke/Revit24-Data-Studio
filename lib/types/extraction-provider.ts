import type { ExtractionJobDocument, ExtractionPlatform } from "@/lib/types/queue";
import type { CreateWorkerLogInput } from "@/lib/types/workers";

export interface JobExecutionProgress {
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  estimatedRecords: number;
}

export interface JobExecutionContext {
  workerId: string;
  workerName: string;
  jobId: string;
  writeLog: (input: CreateWorkerLogInput) => Promise<void>;
  updateJobProgress: (update: Partial<JobExecutionProgress>) => Promise<void>;
  shouldStop: () => boolean;
}

export interface JobExecutionResult {
  processed: number;
  successful: number;
  failed: number;
  jobStatus: ExtractionJobDocument["status"];
}

export interface ExtractionProvider {
  readonly platform: ExtractionPlatform;
  readonly version: string;
  executeJob(
    job: ExtractionJobDocument,
    context: JobExecutionContext,
  ): Promise<JobExecutionResult>;
}
