import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  advancePipelineStage,
  listPipelineJobs,
  updatePipelineJobState,
} from "@/lib/services/pipelineService";
import {
  createExtractionJobFromImportJob,
  getQueueDashboardData,
  getQueueJobDetail,
} from "@/lib/services/queueService";
import {
  computeExtractionProgress,
  getInstagramProfile,
} from "@/lib/services/instagramExtractionService";
import { updateImportJobStatus } from "@/lib/services/importJobService";
import type {
  InstagramExtractionDashboardData,
  InstagramProfilePageData,
} from "@/lib/types/instagram-profiles";
import type { EntityMatchDocument } from "@/lib/types/duplicates";
import type { ExtractionJobDocument } from "@/lib/types/queue";
import { listInstagramProfiles } from "@/lib/repositories/instagramProfilesRepository";
import { mockInstagramProfileStore } from "@/lib/mock-data/instagramProfileStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { listNormalizedRecords } from "@/lib/repositories/normalizedRecordsRepository";
import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { listEntityMatchesByRecordId } from "@/lib/repositories/entityMatchesRepository";

export async function linkPipelineExtractionJob(
  importJobId: string,
  extractionJobId: string,
): Promise<void> {
  const jobs = await listPipelineJobs();
  const pipelineJob = jobs.find((job) => job.importJobId === importJobId);
  if (!pipelineJob) return;

  await updatePipelineJobState(pipelineJob.id, { extractionJobId });
}

export async function queueInstagramImportForExtraction(
  importJobId: string,
): Promise<{ extractionJobId: string | null }> {
  const extraction = await createExtractionJobFromImportJob(importJobId, { autoQueue: true });
  if (!extraction) {
    return { extractionJobId: null };
  }

  await linkPipelineExtractionJob(importJobId, extraction.id);
  await updateImportJobStatus(importJobId, "running");

  return { extractionJobId: extraction.id };
}

export async function completeInstagramExtractionPipeline(
  job: ExtractionJobDocument,
): Promise<void> {
  const jobs = await listPipelineJobs();
  const pipelineJob = jobs.find((entry) => entry.importJobId === job.importJobId);
  if (!pipelineJob) return;

  const hasPending = job.processedRecords < job.estimatedRecords;
  if (hasPending) return;

  await advancePipelineStage(pipelineJob.id, {
    stage: "extraction",
    status: "extracted",
    message: `Extraction completed — ${job.successfulRecords} successful, ${job.failedRecords} failed`,
    processedRecords: job.processedRecords,
    successfulRecords: job.successfulRecords,
    failedRecords: job.failedRecords,
  });

  await advancePipelineStage(pipelineJob.id, {
    stage: "normalization",
    status: "normalized",
    message: "Normalization completed during extraction.",
    processedRecords: job.successfulRecords,
    successfulRecords: job.successfulRecords,
  });

  await advancePipelineStage(pipelineJob.id, {
    stage: "duplicate_detection",
    status: "matching",
    message: "Duplicate suggestions sent to review — no auto-merge.",
    processedRecords: job.successfulRecords,
    successfulRecords: job.successfulRecords,
  });

  await advancePipelineStage(pipelineJob.id, {
    stage: "review",
    status: "review",
    message: "Records awaiting manual review — no automatic approval or publish.",
    processedRecords: job.successfulRecords,
    successfulRecords: job.successfulRecords,
  });

  if (job.failedRecords === 0 && job.successfulRecords > 0) {
    await updateImportJobStatus(job.importJobId, "completed");
  } else if (job.successfulRecords === 0) {
    await updateImportJobStatus(job.importJobId, "failed");
  }
}

function countRateLimited(records: { lastError: string | null }[]): number {
  return records.filter((record) =>
    (record.lastError ?? "").toLowerCase().includes("rate"),
  ).length;
}

export async function getInstagramExtractionDashboardData(): Promise<InstagramExtractionDashboardData> {
  const firebaseConfigured = isFirebaseConfigured();
  const dataMode = isFirestoreAvailable() ? "firestore" : "mock";
  const queueData = await getQueueDashboardData();

  const instagramJobs = queueData.jobs.filter((job) => job.platform === "instagram");
  const activeJobs = instagramJobs.filter(
    (job) => job.status === "running" || job.status === "queued" || job.status === "retrying",
  );

  const stats = instagramJobs.reduce(
    (acc, job) => ({
      totalQueued: acc.totalQueued + job.estimatedRecords,
      processed: acc.processed + job.processedRecords,
      successful: acc.successful + job.successfulRecords,
      failed: acc.failed + job.failedRecords,
      duplicates: acc.duplicates + job.duplicateRecords,
      rateLimited: acc.rateLimited,
    }),
    { totalQueued: 0, processed: 0, successful: 0, failed: 0, duplicates: 0, rateLimited: 0 },
  );

  const runningJob = instagramJobs.find((job) => job.status === "running");
  let progress = null;
  if (runningJob) {
    const detail = await getQueueJobDetail(runningJob.id);
    if (detail) {
      progress = {
        ...computeExtractionProgress(detail.job, detail.records),
        totalQueued: runningJob.estimatedRecords,
        processed: runningJob.processedRecords,
        rateLimited: countRateLimited(detail.records),
        duplicates: runningJob.duplicateRecords,
      };
    }
  }

  const workerStatus = !isInstagramExtractionEnabled()
    ? "disabled"
    : activeJobs.some((job) => job.status === "running")
      ? "running"
      : "idle";

  return {
    extractionEnabled: isInstagramExtractionEnabled(),
    useMock: shouldUseInstagramMockExtraction(),
    activeJobs,
    stats,
    progress,
    workerStatus,
    firebaseConfigured,
    dataMode,
  };
}

async function loadAllProfiles() {
  if (isFirestoreAvailable()) {
    try {
      return await listInstagramProfiles();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockInstagramProfileStore.listInstagramProfiles();
      }
      throw error;
    }
  }
  return mockInstagramProfileStore.listInstagramProfiles();
}

export async function listInstagramProfilesForStudio() {
  return loadAllProfiles();
}

async function loadDuplicateMatches(recordId: string): Promise<EntityMatchDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await listEntityMatchesByRecordId(recordId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockNormalizationStore.listMatchesForRecord(recordId);
      }
      throw error;
    }
  }
  return mockNormalizationStore.listMatchesForRecord(recordId);
}

export async function getInstagramProfilePageData(
  username: string,
): Promise<InstagramProfilePageData | null> {
  const profile = await getInstagramProfile(username);
  if (!profile) return null;

  const firebaseConfigured = isFirebaseConfigured();
  const dataMode = isFirestoreAvailable() ? "firestore" : "mock";

  let normalizedRecord = null;
  if (isFirestoreAvailable()) {
    try {
      const records = await listNormalizedRecords();
      normalizedRecord =
        records.find((record) => record.sourceRecordId === profile.id) ??
        records.find((record) => record.username === profile.username) ??
        null;
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
      normalizedRecord =
        mockNormalizationStore
          .listRecords()
          .find((record) => record.sourceRecordId === profile.id) ?? null;
    }
  } else {
    normalizedRecord =
      mockNormalizationStore
        .listRecords()
        .find((record) => record.sourceRecordId === profile.id) ?? null;
  }

  const duplicateMatches = normalizedRecord
    ? await loadDuplicateMatches(normalizedRecord.id)
    : [];

  return {
    profile,
    normalizedRecord,
    duplicateMatches,
    reviewStatus: normalizedRecord?.status ?? null,
    dataMode,
    firebaseConfigured,
  };
}
