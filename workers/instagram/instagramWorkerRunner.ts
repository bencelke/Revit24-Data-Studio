import type { ProfileExtractionProvider } from "@/lib/types/profile-extraction";
import type { ExtractionRecordDocument } from "@/lib/types/queue";
import { InstagramProfileWorker } from "./instagramProfileWorker";

export interface WorkerRunnerOptions {
  jobId: string;
  workerId?: string;
  records: ExtractionRecordDocument[];
  onRecordStart?: (record: ExtractionRecordDocument) => Promise<void>;
  onRecordComplete?: (
    record: ExtractionRecordDocument,
    result: Awaited<ReturnType<InstagramProfileWorker["processRecord"]>>,
  ) => Promise<void>;
  shouldStop?: () => boolean;
}

export class InstagramWorkerRunner {
  private readonly worker: InstagramProfileWorker;

  constructor(extractor?: ProfileExtractionProvider) {
    this.worker = new InstagramProfileWorker(extractor);
  }

  async runSequential(options: WorkerRunnerOptions): Promise<{
    processed: number;
    successful: number;
    failed: number;
  }> {
    let processed = 0;
    let successful = 0;
    let failed = 0;

    for (const record of options.records) {
      if (options.shouldStop?.()) break;
      if (record.status === "completed") continue;

      await options.onRecordStart?.(record);

      const result = await this.worker.processRecord(record);

      await options.onRecordComplete?.(record, result);

      processed += 1;
      if (result.success) successful += 1;
      else failed += 1;
    }

    return { processed, successful, failed };
  }
}

export const defaultInstagramWorkerRunner = new InstagramWorkerRunner();
