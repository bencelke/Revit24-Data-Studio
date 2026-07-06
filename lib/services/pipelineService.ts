import { mockPipelineStore } from "@/lib/mock-data/pipelineStore";
import { seedPipelineMockDataIfEmpty } from "@/lib/mock-data/pipelineSeedData";
import {
  FirestoreNotConfiguredError,
  MOCK_MODE_WARNING,
  getErrorMessage,
} from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createPipelineJob as persistPipelineJob,
  getPipelineJob as fetchPipelineJob,
  listPipelineJobs as fetchPipelineJobs,
  updatePipelineJob as persistUpdatePipelineJob,
} from "@/lib/repositories/pipelineJobsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreatePipelineJobInput,
  PipelineDashboardData,
  UnifiedPipelineDashboardStats,
  PipelineJobDetailData,
  PipelineJobDocument,
  PipelineListResult,
  PipelineProvider,
  PipelineStage,
  PipelineStatus,
} from "@/lib/types/pipeline";
import { PIPELINE_STAGES } from "@/lib/types/pipeline";
import { getPipelineEventsForJob, logStageTransition } from "@/lib/services/pipelineEventService";
import { getPipelineMetrics } from "@/lib/services/pipelineMetricsService";
import {
  computePipelineProgress,
  createInitialStageProgress,
  estimateRemainingMs,
  formatPipelineProvider,
  formatPipelineStage,
  formatPipelineStatus,
  getNextStage,
  getStageIndex,
  isRunningStatus,
  isTerminalStatus,
  resolveStatusForStage,
  updateStageProgress,
} from "@/lib/services/pipelineStatusService";

const DEFAULT_CREATED_BY = "system-dev";

async function resolveDataMode(): Promise<"firestore" | "mock"> {
  if (isFirestoreAvailable()) return "firestore";
  seedPipelineMockDataIfEmpty();
  return "mock";
}

function buildDashboardStats(jobs: PipelineJobDocument[]): UnifiedPipelineDashboardStats {
  return {
    runningPipelines: jobs.filter((job) => isRunningStatus(job.status)).length,
    queued: jobs.filter((job) => job.status === "queued").length,
    reviewWaiting: jobs.filter((job) => job.status === "review").length,
    readyToPublish: jobs.filter((job) => job.status === "ready_to_publish").length,
    published: jobs.filter((job) => job.status === "published").length,
    failed: jobs.filter((job) => job.status === "failed").length,
  };
}

export async function createPipelineJob(input: {
  provider: PipelineProvider;
  totalRecords?: number;
  createdBy?: string;
  importJobId?: string | null;
  extractionJobId?: string | null;
  sourceJobId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<PipelineJobDocument> {
  const now = new Date().toISOString();
  const payload: CreatePipelineJobInput = {
    provider: input.provider,
    status: "created",
    currentStage: "import",
    progress: 0,
    totalRecords: input.totalRecords ?? 0,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    createdBy: input.createdBy ?? DEFAULT_CREATED_BY,
    createdAt: now,
    updatedAt: now,
    completedAt: null,
    importJobId: input.importJobId ?? null,
    extractionJobId: input.extractionJobId ?? null,
    sourceJobId: input.sourceJobId ?? null,
    stageProgress: createInitialStageProgress(),
    metadata: input.metadata ?? null,
  };

  const mode = await resolveDataMode();
  let job: PipelineJobDocument;

  if (mode === "firestore") {
    try {
      job = await persistPipelineJob(payload);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        job = mockPipelineStore.createJob(payload);
      } else {
        throw error;
      }
    }
  } else {
    job = mockPipelineStore.createJob(payload);
  }

  await logStageTransition({
    jobId: job.id,
    stage: "import",
    status: "created",
    message: `${formatPipelineProvider(job.provider)} pipeline job created.`,
  });

  return job;
}

export async function getPipelineJobById(id: string): Promise<PipelineJobDocument | null> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchPipelineJob(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockPipelineStore.getJob(id);
      }
      throw error;
    }
  }
  return mockPipelineStore.getJob(id);
}

export async function listPipelineJobs(): Promise<PipelineJobDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchPipelineJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedPipelineMockDataIfEmpty();
        return mockPipelineStore.listJobs();
      }
      throw error;
    }
  }
  return mockPipelineStore.listJobs();
}

export async function updatePipelineJobState(
  jobId: string,
  update: Partial<CreatePipelineJobInput>,
): Promise<PipelineJobDocument | null> {
  const mode = await resolveDataMode();
  const payload = { ...update, updatedAt: new Date().toISOString() };

  if (mode === "firestore") {
    try {
      await persistUpdatePipelineJob(jobId, payload);
      return await fetchPipelineJob(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockPipelineStore.updateJob(jobId, payload);
      }
      throw error;
    }
  }

  return mockPipelineStore.updateJob(jobId, payload);
}

export async function advancePipelineStage(
  jobId: string,
  options?: {
    stage?: PipelineStage;
    status?: PipelineStatus;
    message?: string;
    processedRecords?: number;
    successfulRecords?: number;
    failedRecords?: number;
    totalRecords?: number;
    worker?: string | null;
    durationMs?: number | null;
    recordId?: string | null;
  },
): Promise<PipelineJobDocument | null> {
  const job = await getPipelineJobById(jobId);
  if (!job) return null;

  const targetStage = options?.stage ?? getNextStage(job.currentStage) ?? job.currentStage;
  const targetStatus = options?.status ?? resolveStatusForStage(targetStage);
  const now = new Date().toISOString();
  const stageIndex = getStageIndex(targetStage);

  let stageProgress = updateStageProgress(job.stageProgress, targetStage, {
    status: "running",
    startedAt: now,
    recordCount: options?.processedRecords ?? job.processedRecords,
    errorCount: options?.failedRecords ?? job.failedRecords,
  });

  const previousStage = getNextStage(targetStage) ? null : targetStage;
  if (previousStage && getStageIndex(previousStage) >= 0) {
    const prev = PIPELINE_STAGES[getStageIndex(targetStage) - 1];
    if (prev) {
      stageProgress = updateStageProgress(stageProgress, prev, {
        status: "completed",
        completedAt: now,
        durationMs: options?.durationMs ?? null,
      });
    }
  }

  const processedRecords = options?.processedRecords ?? job.processedRecords;
  const totalRecords = options?.totalRecords ?? job.totalRecords;
  const progress = computePipelineProgress(processedRecords, totalRecords, stageIndex);

  const updated = await updatePipelineJobState(jobId, {
    status: targetStatus,
    currentStage: targetStage,
    progress,
    processedRecords,
    successfulRecords: options?.successfulRecords ?? job.successfulRecords,
    failedRecords: options?.failedRecords ?? job.failedRecords,
    totalRecords,
    stageProgress,
    completedAt: isTerminalStatus(targetStatus) ? now : job.completedAt,
  });

  await logStageTransition({
    jobId,
    recordId: options?.recordId ?? null,
    stage: targetStage,
    status: targetStatus,
    message:
      options?.message ??
      `Advanced to ${formatPipelineStage(targetStage)} (${formatPipelineStatus(targetStatus)}).`,
    duration: options?.durationMs ?? null,
    worker: options?.worker ?? null,
  });

  return updated;
}

export async function markPipelineFailed(
  jobId: string,
  message: string,
): Promise<PipelineJobDocument | null> {
  const job = await getPipelineJobById(jobId);
  if (!job) return null;

  const now = new Date().toISOString();
  const stageProgress = updateStageProgress(job.stageProgress, job.currentStage, {
    status: "failed",
    completedAt: now,
    errorCount: job.failedRecords + 1,
  });

  const updated = await updatePipelineJobState(jobId, {
    status: "failed",
    stageProgress,
    completedAt: now,
  });

  await logStageTransition({
    jobId,
    stage: job.currentStage,
    status: "failed",
    message,
  });

  return updated;
}

export async function getPipelineDashboardData(): Promise<PipelineDashboardData> {
  try {
    const jobs = await listPipelineJobs();
    const stats = buildDashboardStats(jobs);
    const metrics = getPipelineMetrics(jobs);
    const mode = await resolveDataMode();

    return {
      stats,
      metrics,
      recentJobs: jobs.slice(0, 20),
      dataMode: mode,
      firebaseConfigured: isFirebaseConfigured(),
      warning: mode === "mock" ? MOCK_MODE_WARNING : undefined,
    };
  } catch (error) {
    seedPipelineMockDataIfEmpty();
    const jobs = mockPipelineStore.listJobs();
    return {
      stats: buildDashboardStats(jobs),
      metrics: getPipelineMetrics(jobs),
      recentJobs: jobs.slice(0, 20),
      dataMode: "mock",
      firebaseConfigured: isFirebaseConfigured(),
      warning: getErrorMessage(error),
    };
  }
}

export async function getPipelineJobDetail(jobId: string): Promise<PipelineJobDetailData | null> {
  const job = await getPipelineJobById(jobId);
  if (!job) return null;

  const events = await getPipelineEventsForJob(jobId);
  const mode = await resolveDataMode();

  return {
    job,
    events,
    estimatedRemainingMs: estimateRemainingMs(job.createdAt, job.progress),
    dataMode: mode,
    firebaseConfigured: isFirebaseConfigured(),
  };
}

export async function getPipelineListResult(
  page = 1,
  pageSize = 20,
): Promise<PipelineListResult> {
  const jobs = await listPipelineJobs();
  const total = jobs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    jobs: jobs.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export {
  formatPipelineProvider,
  formatPipelineStage,
  formatPipelineStatus,
};
