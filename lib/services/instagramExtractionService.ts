import { mockInstagramProfileStore } from "@/lib/mock-data/instagramProfileStore";
import { mockQueueStore } from "@/lib/mock-data/queueStore";
import { mockWorkerStore } from "@/lib/mock-data/workerStore";
import { FirestoreNotConfiguredError, getErrorMessage } from "@/lib/errors/app-errors";
import {
  getExtractionJob as fetchExtractionJob,
  updateExtractionJob as persistUpdateExtractionJob,
} from "@/lib/repositories/extractionJobsRepository";
import {
  listExtractionRecords as fetchExtractionRecords,
  updateExtractionRecord as persistUpdateExtractionRecord,
} from "@/lib/repositories/extractionRecordsRepository";
import {
  getInstagramProfileByUsername as fetchInstagramProfileByUsername,
  upsertInstagramProfile as persistInstagramProfile,
} from "@/lib/repositories/instagramProfilesRepository";
import { createWorkerLog as persistWorkerLog } from "@/lib/repositories/workerLogsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateInstagramProfileInput,
  InstagramExtractionRunResult,
  InstagramJobExtractionResult,
  InstagramProfileDocument,
  InstagramProfileStatus,
  QueueExtractionProgress,
} from "@/lib/types/instagram-profiles";
import type { ExtractionErrorCode } from "@/lib/types/profile-extraction";
import type { ExtractionJobDocument, ExtractionRecordDocument } from "@/lib/types/queue";
import type { CreateWorkerLogInput, WorkerLogDocument } from "@/lib/types/workers";
import { listWorkerLogs } from "@/lib/services/workerService";
import { defaultInstagramPublicProfileProvider } from "@/workers/instagram/instagramPublicProfileProvider";
import { defaultInstagramWorkerRunner } from "@/workers/instagram/instagramWorkerRunner";
import { INSTAGRAM_WORKER_VERSION } from "@/workers/instagram/constants";

const WORKER_ID = "worker_mac_studio";
const WORKER_NAME = "Mac Studio — Primary";
import { getInstagramExtractionDelayMs } from "@/lib/config/instagramProvider";

function mapErrorToProfileStatus(code: ExtractionErrorCode | undefined): InstagramProfileStatus {
  switch (code) {
    case "PRIVATE_PROFILE":
      return "private";
    case "PROFILE_NOT_FOUND":
      return "not_found";
    default:
      return "failed";
  }
}

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

async function loadExtractionJob(jobId: string): Promise<ExtractionJobDocument | null> {
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

async function loadExtractionRecords(jobId: string): Promise<ExtractionRecordDocument[]> {
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

async function saveExtractionRecordUpdate(
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

async function saveExtractionJobUpdate(
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

async function saveInstagramProfile(
  input: CreateInstagramProfileInput,
): Promise<InstagramProfileDocument> {
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

export async function getInstagramProfile(
  username: string,
): Promise<InstagramProfileDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchInstagramProfileByUsername(username);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockInstagramProfileStore.getInstagramProfileByUsername(username);
      }
      throw error;
    }
  }
  return mockInstagramProfileStore.getInstagramProfileByUsername(username);
}

export function computeExtractionProgress(
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
      remaining > 0 ? Math.ceil((remaining * getInstagramExtractionDelayMs()) / 1000) : null,
  };
}

export async function extractSingleInstagramProfile(
  input: string,
  options: {
    jobId?: string;
    extractionRecordId?: string;
    importRecordId?: string;
  } = {},
): Promise<InstagramExtractionRunResult> {
  const startedAt = Date.now();
  const result = await defaultInstagramPublicProfileProvider.extractProfile({
    profileUrl: input.includes("instagram") ? input : undefined,
    username: input.includes("instagram") ? undefined : input,
  });

  const timestamp = new Date().toISOString();
  let profile: InstagramProfileDocument | null = null;

  if (result.success && result.data) {
    profile = await saveInstagramProfile({
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
      extractionJobId: options.jobId ?? null,
      extractionRecordId: options.extractionRecordId ?? null,
      importRecordId: options.importRecordId ?? null,
      rawJson: null,
    });

    await writeWorkerLog({
      timestamp,
      workerId: WORKER_ID,
      workerName: WORKER_NAME,
      level: "info",
      event: "Profile Completed",
      jobId: options.jobId ?? null,
      message: `Extracted public metadata for @${result.data.username}`,
    });
  } else {
    await writeWorkerLog({
      timestamp,
      workerId: WORKER_ID,
      workerName: WORKER_NAME,
      level: "error",
      event: "Profile Failed",
      jobId: options.jobId ?? null,
      message: result.error?.message ?? "Extraction failed.",
    });
  }

  return {
    username: result.data?.username ?? input.replace("@", ""),
    profile,
    success: result.success,
    error: result.error?.message ?? null,
    durationMs: Date.now() - startedAt,
  };
}

export async function extractInstagramProfileBatch(
  inputs: string[],
): Promise<InstagramExtractionRunResult[]> {
  const results: InstagramExtractionRunResult[] = [];
  for (const input of inputs) {
    results.push(await extractSingleInstagramProfile(input));
  }
  return results;
}

export async function runInstagramExtractionJob(
  jobId: string,
  options: { maxRecords?: number } = {},
): Promise<InstagramJobExtractionResult> {
  const job = await loadExtractionJob(jobId);
  if (!job) {
    throw new Error("Extraction job not found.");
  }

  const records = await loadExtractionRecords(jobId);
  const pending = records.filter(
    (record) => record.status === "waiting" || record.status === "queued" || record.status === "retrying",
  );
  const toProcess = options.maxRecords ? pending.slice(0, options.maxRecords) : pending;

  const startedAt = new Date().toISOString();

  await saveExtractionJobUpdate(jobId, {
    status: "running",
    startedAt: job.startedAt ?? startedAt,
    workerVersion: INSTAGRAM_WORKER_VERSION,
  });

  await writeWorkerLog({
    timestamp: startedAt,
    workerId: WORKER_ID,
    workerName: WORKER_NAME,
    level: "info",
    event: "Job Started",
    jobId,
    message: `Starting Instagram extraction for ${toProcess.length} profile(s)`,
  });

  mockQueueStore.addTimelineEvent(jobId, {
    timestamp: startedAt,
    status: "running",
    message: `Worker started processing ${toProcess.length} profile(s)`,
    actor: WORKER_ID,
  });

  let processedTotal = job.processedRecords;
  let successfulTotal = job.successfulRecords;
  let failedTotal = job.failedRecords;

  const runResults: InstagramExtractionRunResult[] = [];

  const runner = defaultInstagramWorkerRunner;

  await runner.runSequential({
    jobId,
    workerId: WORKER_ID,
    records: toProcess,
    onRecordStart: async (record) => {
      await saveExtractionRecordUpdate(record.id, {
        status: "running",
        startedAt: new Date().toISOString(),
        workerId: WORKER_ID,
        attempts: record.attempts + 1,
      });

      await writeWorkerLog({
        timestamp: new Date().toISOString(),
        workerId: WORKER_ID,
        workerName: WORKER_NAME,
        level: "info",
        event: "Profile Started",
        jobId,
        message: `Processing @${record.username ?? "unknown"}`,
      });
    },
    onRecordComplete: async (record, result) => {
      const timestamp = new Date().toISOString();
      const isSuccess = result.success && result.data;

      if (isSuccess && result.data) {
        const profile = await saveInstagramProfile({
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
          extractionJobId: jobId,
          extractionRecordId: record.id,
          importRecordId: record.importRecordId,
          rawJson: null,
        });

        runResults.push({
          username: result.username,
          profile,
          success: true,
          error: null,
          durationMs: result.durationMs,
        });

        successfulTotal += 1;

        await writeWorkerLog({
          timestamp,
          workerId: WORKER_ID,
          workerName: WORKER_NAME,
          level: "info",
          event: "Profile Completed",
          jobId,
          message: `Extracted @${result.data.username} in ${result.durationMs}ms`,
        });
      } else {
        const errorCode = result.error?.code;
        const profileStatus = mapErrorToProfileStatus(errorCode);

        if (record.username) {
          await saveInstagramProfile({
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
            status: profileStatus,
            errorCode: errorCode ?? "UNKNOWN",
            errorMessage: result.error?.message ?? "Extraction failed",
            extractionJobId: jobId,
            extractionRecordId: record.id,
            importRecordId: record.importRecordId,
            rawJson: null,
          });
        }

        runResults.push({
          username: result.username,
          profile: null,
          success: false,
          error: result.error?.message ?? "Extraction failed",
          durationMs: result.durationMs,
        });

        failedTotal += 1;

        await writeWorkerLog({
          timestamp,
          workerId: WORKER_ID,
          workerName: WORKER_NAME,
          level: result.error?.retryable ? "warning" : "error",
          event: "Profile Failed",
          jobId,
          message: result.error?.message ?? "Extraction failed",
        });
      }

      processedTotal += 1;

      await saveExtractionRecordUpdate(record.id, {
        status: isSuccess ? "completed" : "failed",
        completedAt: timestamp,
        lastError: isSuccess ? null : result.error?.message ?? "Extraction failed",
        workerId: WORKER_ID,
      });

      await saveExtractionJobUpdate(jobId, {
        processedRecords: processedTotal,
        successfulRecords: successfulTotal,
        failedRecords: failedTotal,
      });
    },
  });

  const completedAt = new Date().toISOString();
  const updatedRecords = await loadExtractionRecords(jobId);
  const hasPending = updatedRecords.some(
    (record) =>
      record.status === "waiting" ||
      record.status === "queued" ||
      record.status === "retrying",
  );

  const finalStatus = hasPending ? "running" : failedTotal > 0 && successfulTotal === 0 ? "failed" : "completed";

  await saveExtractionJobUpdate(jobId, {
    status: finalStatus,
    completedAt: hasPending ? null : completedAt,
    processedRecords: processedTotal,
    successfulRecords: successfulTotal,
    failedRecords: failedTotal,
    workerVersion: INSTAGRAM_WORKER_VERSION,
  });

  await writeWorkerLog({
    timestamp: completedAt,
    workerId: WORKER_ID,
    workerName: WORKER_NAME,
    level: finalStatus === "failed" ? "error" : "info",
    event: "Job Completed",
    jobId,
    message: `Processed ${runResults.length} profile(s) — ${successfulTotal} successful, ${failedTotal} failed`,
  });

  mockQueueStore.addTimelineEvent(jobId, {
    timestamp: completedAt,
    status: finalStatus,
    message: `Worker finished batch — ${successfulTotal} successful, ${failedTotal} failed`,
    actor: WORKER_ID,
  });

  return {
    jobId,
    processed: runResults.length,
    successful: runResults.filter((result) => result.success).length,
    failed: runResults.filter((result) => !result.success).length,
    results: runResults,
    jobStatus: finalStatus,
  };
}

export async function getWorkerLogsForJob(jobId: string, max = 20): Promise<WorkerLogDocument[]> {
  const logs = await listWorkerLogs(max * 3);
  return logs.filter((log) => log.jobId === jobId).slice(0, max);
}

export { getErrorMessage };
