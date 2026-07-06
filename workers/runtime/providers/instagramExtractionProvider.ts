import { mockInstagramProfileStore } from "@/lib/mock-data/instagramProfileStore";
import { mockQueueStore } from "@/lib/mock-data/queueStore";
import { RUNTIME_CONFIG } from "@/lib/config/runtime";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  getExtractionJob as fetchExtractionJob,
  updateExtractionJob as persistUpdateExtractionJob,
} from "@/lib/repositories/extractionJobsRepository";
import {
  listExtractionRecords as fetchExtractionRecords,
  updateExtractionRecord as persistUpdateExtractionRecord,
} from "@/lib/repositories/extractionRecordsRepository";
import { upsertInstagramProfile as persistInstagramProfile } from "@/lib/repositories/instagramProfilesRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { normalizeInstagramProfile } from "@/lib/services/normalizationPipeline";
import { logInstagramExtractionPipelineEvent } from "@/lib/services/instagramPipelineLogging";
import type {
  ExtractionProvider,
  JobExecutionContext,
  JobExecutionResult,
} from "@/lib/types/extraction-provider";
import type { CreateInstagramProfileInput, InstagramProfileStatus } from "@/lib/types/instagram-profiles";
import type { ExtractionErrorCode } from "@/lib/types/profile-extraction";
import type { ExtractionJobDocument, ExtractionRecordDocument } from "@/lib/types/queue";
import { defaultInstagramWorkerRunner } from "@/workers/instagram/instagramWorkerRunner";
import { INSTAGRAM_WORKER_VERSION } from "@/workers/instagram/constants";

function mapErrorToProfileStatus(code: ExtractionErrorCode | undefined): InstagramProfileStatus {
  switch (code) {
    case "PRIVATE_PROFILE":
      return "private";
    case "PROFILE_NOT_FOUND":
      return "not_found";
    case "PROFILE_UNAVAILABLE":
    case "BLOCKED":
    case "RATE_LIMITED":
    case "TIMEOUT":
    case "PARSE_FAILED":
    case "PARSE_ERROR":
    case "UNEXPECTED_HTML":
    case "NETWORK_FAILURE":
      return "failed";
    default:
      return "failed";
  }
}

async function loadJob(jobId: string): Promise<ExtractionJobDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchExtractionJob(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockQueueStore.getExtractionJob(jobId);
      }
      throw error;
    }
  }
  return mockQueueStore.getExtractionJob(jobId);
}

async function loadRecords(jobId: string): Promise<ExtractionRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchExtractionRecords(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockQueueStore.listExtractionRecords(jobId);
      }
      throw error;
    }
  }
  return mockQueueStore.listExtractionRecords(jobId);
}

async function saveRecordUpdate(
  id: string,
  data: Partial<ExtractionRecordDocument>,
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateExtractionRecord(id, data);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockQueueStore.updateExtractionRecord(id, data);
        return;
      }
      throw error;
    }
  }
  mockQueueStore.updateExtractionRecord(id, data);
}

async function saveJobUpdate(
  jobId: string,
  data: Partial<ExtractionJobDocument>,
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateExtractionJob(jobId, data);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockQueueStore.updateExtractionJob(jobId, data);
        return;
      }
      throw error;
    }
  }
  mockQueueStore.updateExtractionJob(jobId, data);
}

async function saveProfile(input: CreateInstagramProfileInput) {
  if (isFirestoreAvailable()) {
    try {
      return await persistInstagramProfile(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockInstagramProfileStore.upsertInstagramProfile(input);
      }
      throw error;
    }
  }
  return mockInstagramProfileStore.upsertInstagramProfile(input);
}

function getPendingRecords(records: ExtractionRecordDocument[]): ExtractionRecordDocument[] {
  return records.filter(
    (record) =>
      record.status === "waiting" ||
      record.status === "queued" ||
      record.status === "retrying",
  );
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class InstagramExtractionProvider implements ExtractionProvider {
  readonly platform = "instagram" as const;
  readonly version = INSTAGRAM_WORKER_VERSION;

  async executeJob(
    job: ExtractionJobDocument,
    context: JobExecutionContext,
  ): Promise<JobExecutionResult> {
    const records = await loadRecords(job.id);
    const pending = getPendingRecords(records).slice(0, RUNTIME_CONFIG.batchSize);

    let processedTotal = job.processedRecords;
    let successfulTotal = job.successfulRecords;
    let failedTotal = job.failedRecords;

    await context.writeLog({
      timestamp: new Date().toISOString(),
      workerId: context.workerId,
      workerName: context.workerName,
      level: "info",
      event: "Job Claimed",
      jobId: job.id,
      message: `Claimed extraction job "${job.name}" with ${pending.length} pending record(s)`,
    });

    await saveJobUpdate(job.id, {
      status: "running",
      workerVersion: this.version,
    });

    const runner = defaultInstagramWorkerRunner;

    await runner.runSequential({
      jobId: job.id,
      workerId: context.workerId,
      records: pending,
      shouldStop: context.shouldStop,
      onRecordStart: async (record) => {
        await saveRecordUpdate(record.id, {
          status: "running",
          startedAt: new Date().toISOString(),
          workerId: context.workerId,
          attempts: record.attempts + 1,
        });

        await context.writeLog({
          timestamp: new Date().toISOString(),
          workerId: context.workerId,
          workerName: context.workerName,
          level: "info",
          event: "Profile Started",
          jobId: job.id,
          message: `Processing @${record.username ?? "unknown"}`,
        });

        await logInstagramExtractionPipelineEvent({
          importJobId: job.importJobId,
          recordId: record.importRecordId,
          message: `Extracting @${record.username ?? "unknown"}`,
          status: "extracting",
        });
      },
      onRecordComplete: async (record, result) => {
        const timestamp = new Date().toISOString();
        const isSuccess = result.success && result.data;

        if (isSuccess && result.data) {
          const profile = await saveProfile({
            username: result.data.username,
            displayName: result.data.displayName,
            bio: result.data.bio,
            profileImageUrl: result.data.profileImageUrl,
            profileUrl: result.data.profileUrl,
            website: result.data.website,
            publicEmail: result.data.publicEmail,
            publicPhone: result.data.publicPhone,
            followers: result.data.followers,
            following: result.data.following,
            posts: result.data.posts,
            verified: result.data.verified,
            businessCategory: result.data.businessCategory,
            extractedAt: timestamp,
            extractionDurationMs: result.durationMs,
            workerVersion: result.workerVersion,
            status: "completed",
            errorCode: null,
            errorMessage: null,
            extractionJobId: job.id,
            extractionRecordId: record.id,
            importRecordId: record.importRecordId,
            rawJson: null,
          });

          try {
            await normalizeInstagramProfile(profile);
          } catch {
            // Normalization failure should not fail extraction
          }

          successfulTotal += 1;

          await context.writeLog({
            timestamp,
            workerId: context.workerId,
            workerName: context.workerName,
            level: "info",
            event: "Profile Completed",
            jobId: job.id,
            message: `Extracted and normalized @${result.data.username}`,
          });

          await logInstagramExtractionPipelineEvent({
            importJobId: job.importJobId,
            recordId: record.importRecordId,
            message: `Extracted @${result.data.username} — sent to review`,
            status: "extracted",
          });
        } else {
          const errorCode = result.error?.code;
          const isRetryable = result.error?.retryable ?? false;
          const attempts = record.attempts + 1;
          const shouldRetry =
            isRetryable && attempts < RUNTIME_CONFIG.maxRetryAttempts;

          if (record.username) {
            await saveProfile({
              username: record.username,
              displayName: null,
              bio: null,
              profileImageUrl: null,
              profileUrl: record.profileUrl ?? `https://www.instagram.com/${record.username}/`,
              website: null,
              publicEmail: null,
              publicPhone: null,
              followers: null,
              following: null,
              posts: null,
              verified: false,
              businessCategory: null,
              extractedAt: timestamp,
              extractionDurationMs: result.durationMs,
              workerVersion: result.workerVersion,
              status: mapErrorToProfileStatus(errorCode),
              errorCode: errorCode ?? "UNKNOWN",
              errorMessage: result.error?.message ?? "Extraction failed",
              extractionJobId: job.id,
              extractionRecordId: record.id,
              importRecordId: record.importRecordId,
              rawJson: null,
            });
          }

          if (shouldRetry) {
            await saveRecordUpdate(record.id, {
              status: "retrying",
              lastError: result.error?.message ?? "Extraction failed",
              workerId: context.workerId,
            });

            await context.writeLog({
              timestamp,
              workerId: context.workerId,
              workerName: context.workerName,
              level: "warning",
              event: "Profile Failed",
              jobId: job.id,
              message: `Retry scheduled (${attempts}/${RUNTIME_CONFIG.maxRetryAttempts}): ${result.error?.message ?? "Extraction failed"}`,
            });

            await sleep(RUNTIME_CONFIG.retryDelayMs);
            return;
          }

          failedTotal += 1;

          await context.writeLog({
            timestamp,
            workerId: context.workerId,
            workerName: context.workerName,
            level: result.error?.retryable ? "warning" : "error",
            event: "Profile Failed",
            jobId: job.id,
            message: result.error?.message ?? "Extraction failed",
          });

          if (!shouldRetry) {
            await logInstagramExtractionPipelineEvent({
              importJobId: job.importJobId,
              recordId: record.importRecordId,
              message: result.error?.message ?? "Extraction failed",
              status: "failed",
            });
          }

          await saveRecordUpdate(record.id, {
            status: "failed",
            completedAt: timestamp,
            lastError: result.error?.message ?? "Extraction failed",
            workerId: context.workerId,
          });
        }

        if (isSuccess) {
          processedTotal += 1;

          await saveRecordUpdate(record.id, {
            status: "completed",
            completedAt: timestamp,
            lastError: null,
            workerId: context.workerId,
          });
        } else {
          const refreshed = await loadRecords(job.id);
          const recordState = refreshed.find((item) => item.id === record.id);
          if (recordState?.status !== "retrying") {
            processedTotal += 1;
          }
        }

        await saveJobUpdate(job.id, {
          processedRecords: processedTotal,
          successfulRecords: successfulTotal,
          failedRecords: failedTotal,
        });

        await context.updateJobProgress({
          processedRecords: processedTotal,
          successfulRecords: successfulTotal,
          failedRecords: failedTotal,
          estimatedRecords: job.estimatedRecords,
        });
      },
    });

    const updatedRecords = await loadRecords(job.id);
    const hasPending = getPendingRecords(updatedRecords).length > 0;
    const completedAt = new Date().toISOString();
    const finalStatus = hasPending
      ? "running"
      : failedTotal > 0 && successfulTotal === 0
        ? "failed"
        : "completed";

    await saveJobUpdate(job.id, {
      status: finalStatus,
      completedAt: hasPending ? null : completedAt,
      processedRecords: processedTotal,
      successfulRecords: successfulTotal,
      failedRecords: failedTotal,
      workerVersion: this.version,
      claimedByWorkerId: hasPending ? context.workerId : null,
      claimedAt: hasPending ? job.claimedAt : null,
    });

    await context.writeLog({
      timestamp: completedAt,
      workerId: context.workerId,
      workerName: context.workerName,
      level: finalStatus === "failed" ? "error" : "info",
      event: "Job Completed",
      jobId: job.id,
      message: `Finished batch — ${successfulTotal} successful, ${failedTotal} failed`,
    });

    mockQueueStore.addTimelineEvent(job.id, {
      timestamp: completedAt,
      status: finalStatus,
      message: `Worker finished — ${successfulTotal} successful, ${failedTotal} failed`,
      actor: context.workerId,
    });

    const refreshedJob = await loadJob(job.id);

    return {
      processed: processedTotal - job.processedRecords,
      successful: successfulTotal - job.successfulRecords,
      failed: failedTotal - job.failedRecords,
      jobStatus: refreshedJob?.status ?? finalStatus,
    };
  }
}

export const defaultInstagramExtractionProvider = new InstagramExtractionProvider();
