import { mockQueueStore } from "@/lib/mock-data/queueStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  claimExtractionJobTransaction,
  listExtractionJobs,
} from "@/lib/repositories/extractionJobsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type { ExtractionJobDocument, ExtractionPriority } from "@/lib/types/queue";

const PRIORITY_ORDER: Record<ExtractionPriority, number> = {
  critical: 0,
  high: 1,
  normal: 2,
  low: 3,
};

function sortClaimableJobs(jobs: ExtractionJobDocument[]): ExtractionJobDocument[] {
  return [...jobs]
    .filter((job) => job.status === "queued" || job.status === "retrying")
    .sort((a, b) => {
      const priorityDiff = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    });
}

async function loadJobs(): Promise<ExtractionJobDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await listExtractionJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockQueueStore.listExtractionJobs();
      }
      throw error;
    }
  }
  return mockQueueStore.listExtractionJobs();
}

async function claimJob(
  jobId: string,
  workerId: string,
): Promise<ExtractionJobDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await claimExtractionJobTransaction(jobId, workerId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockQueueStore.claimExtractionJob(jobId, workerId);
      }
      throw error;
    }
  }
  return mockQueueStore.claimExtractionJob(jobId, workerId);
}

export async function findNextClaimableJob(): Promise<ExtractionJobDocument | null> {
  const jobs = await loadJobs();
  const claimable = sortClaimableJobs(jobs);
  return claimable[0] ?? null;
}

export async function claimNextQueuedJob(
  workerId: string,
): Promise<ExtractionJobDocument | null> {
  const nextJob = await findNextClaimableJob();
  if (!nextJob) return null;

  const claimed = await claimJob(nextJob.id, workerId);
  return claimed;
}

export { sortClaimableJobs, PRIORITY_ORDER };
