import { mockWorkerStore } from "@/lib/mock-data/workerStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { createWorkerLog as persistWorkerLog } from "@/lib/repositories/workerLogsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  ExtractionProvider,
  JobExecutionContext,
  JobExecutionResult,
} from "@/lib/types/extraction-provider";
import type { ExtractionJobDocument } from "@/lib/types/queue";
import type { CreateWorkerLogInput } from "@/lib/types/workers";
import { getExtractionProvider } from "@/workers/runtime/extractionProviderRegistry";

async function writeWorkerLog(input: CreateWorkerLogInput): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistWorkerLog(input);
      return;
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
    }
  }
  mockWorkerStore.createWorkerLog(input);
}

export interface JobExecutorOptions {
  workerId: string;
  workerName: string;
  shouldStop?: () => boolean;
  provider?: ExtractionProvider;
}

export async function executeExtractionJob(
  job: ExtractionJobDocument,
  options: JobExecutorOptions,
): Promise<JobExecutionResult> {
  const provider =
    options.provider ?? getExtractionProvider(job.platform);

  if (!provider) {
    throw new Error(`No extraction provider registered for platform: ${job.platform}`);
  }

  const context: JobExecutionContext = {
    workerId: options.workerId,
    workerName: options.workerName,
    jobId: job.id,
    writeLog: writeWorkerLog,
    updateJobProgress: async () => {
      // Progress is persisted inside the provider after each record
    },
    shouldStop: options.shouldStop ?? (() => false),
  };

  return provider.executeJob(job, context);
}
