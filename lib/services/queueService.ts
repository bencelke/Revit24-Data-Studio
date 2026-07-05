import { mockQueueStore } from "@/lib/mock-data/queueStore";
import { seedQueueMockDataIfEmpty } from "@/lib/mock-data/queueSeedData";
import {
  FirestoreNotConfiguredError,
  MOCK_MODE_WARNING,
  getErrorMessage,
} from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { createAppLog } from "@/lib/repositories/appLogsRepository";
import {
  createExtractionJob as persistExtractionJob,
  getExtractionJob as fetchExtractionJob,
  listExtractionJobs as fetchExtractionJobs,
  updateExtractionJob as persistUpdateExtractionJob,
} from "@/lib/repositories/extractionJobsRepository";
import {
  createExtractionRecords as persistExtractionRecords,
  listExtractionRecords as fetchExtractionRecords,
} from "@/lib/repositories/extractionRecordsRepository";
import { getImportJob, listImportJobs } from "@/lib/repositories/importJobsRepository";
import { listImportRecords } from "@/lib/repositories/importRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { mockImportJobStore } from "@/lib/mock-data/importJobStore";
import type { ImportJobDocument, ImportRecordDocument } from "@/lib/types/import-jobs";
import type {
  ExtractionJobDocument,
  ExtractionJobWithRecords,
  ExtractionRecordDocument,
  QueueAction,
  QueueActionPayload,
  QueueDashboardData,
  QueueDashboardStats,
  QueueFilterParams,
  QueueJobDetailData,
  QueueJobView,
  QueueListResult,
  QueueSortDirection,
  QueueSortField,
  QueueTimelineEvent,
} from "@/lib/types/queue";
import {
  calculateDurationMs,
  calculateProgress,
  formatDuration,
} from "@/lib/types/queue";

const CREATED_BY = "system-dev";

async function writeLog(
  event: string,
  details: Record<string, unknown>,
  level: "info" | "warning" | "error" = "info",
): Promise<void> {
  if (!isFirestoreAvailable()) return;
  try {
    await createAppLog({
      timestamp: new Date().toISOString(),
      event,
      user: CREATED_BY,
      details,
      level,
    });
  } catch {
    // Non-blocking
  }
}

function isToday(isoDate: string): boolean {
  const date = new Date(isoDate);
  const today = new Date();
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

function mapPlatformFromSource(source: string): ExtractionJobDocument["platform"] {
  if (source === "instagram") return "instagram";
  if (source === "google_places") return "google_places";
  if (source === "website") return "website";
  return "instagram";
}

function toJobView(
  job: ExtractionJobDocument,
  importJobMap: Map<string, ImportJobDocument>,
): QueueJobView {
  return {
    ...job,
    importJobName: importJobMap.get(job.importJobId)?.name ?? job.importJobId,
    progressPercent: calculateProgress(job.processedRecords, job.estimatedRecords),
    durationMs: calculateDurationMs(job.startedAt, job.completedAt),
  };
}

async function loadImportJobMap(): Promise<Map<string, ImportJobDocument>> {
  if (isFirestoreAvailable()) {
    try {
      const jobs = await listImportJobs();
      return new Map(jobs.map((job) => [job.id, job]));
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
    }
  }
  return new Map(mockImportJobStore.listImportJobs().map((job) => [job.id, job]));
}

async function loadExtractionJobs(): Promise<ExtractionJobDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchExtractionJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedQueueMockDataIfEmpty();
        return mockQueueStore.listExtractionJobs();
      }
      throw error;
    }
  }
  seedQueueMockDataIfEmpty();
  return mockQueueStore.listExtractionJobs();
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

async function loadImportRecordsForJob(jobId: string): Promise<ImportRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await listImportRecords(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockImportJobStore.listImportRecords(jobId);
      }
      throw error;
    }
  }
  return mockImportJobStore.listImportRecords(jobId);
}

async function loadImportJob(jobId: string): Promise<ImportJobDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await getImportJob(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockImportJobStore.getImportJob(jobId);
      }
      throw error;
    }
  }
  return mockImportJobStore.getImportJob(jobId);
}

function computeStats(jobs: ExtractionJobDocument[]): QueueDashboardStats {
  return {
    waiting: jobs.filter((job) => job.status === "waiting").length,
    queued: jobs.filter((job) => job.status === "queued").length,
    running: jobs.filter((job) => job.status === "running").length,
    completedToday: jobs.filter(
      (job) => job.status === "completed" && job.completedAt && isToday(job.completedAt),
    ).length,
    failed: jobs.filter((job) => job.status === "failed").length,
    paused: jobs.filter((job) => job.status === "paused").length,
    retrying: jobs.filter((job) => job.status === "retrying").length,
  };
}

function filterJobs(jobs: QueueJobView[], params: QueueFilterParams): QueueJobView[] {
  const search = params.search?.trim().toLowerCase() ?? "";

  return jobs.filter((job) => {
    if (params.status && params.status !== "all" && job.status !== params.status) {
      return false;
    }
    if (params.platform && params.platform !== "all" && job.platform !== params.platform) {
      return false;
    }
    if (params.priority && params.priority !== "all" && job.priority !== params.priority) {
      return false;
    }
    if (!search) return true;

    const haystack = [job.name, job.importJobName, job.platform, job.status, job.notes]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });
}

function sortJobs(
  jobs: QueueJobView[],
  sortField: QueueSortField,
  sortDirection: QueueSortDirection,
): QueueJobView[] {
  const direction = sortDirection === "asc" ? 1 : -1;

  return [...jobs].sort((a, b) => {
    switch (sortField) {
      case "name":
        return a.name.localeCompare(b.name) * direction;
      case "platform":
        return a.platform.localeCompare(b.platform) * direction;
      case "status":
        return a.status.localeCompare(b.status) * direction;
      case "priority": {
        const order = { critical: 4, high: 3, normal: 2, low: 1 };
        return (order[a.priority] - order[b.priority]) * direction;
      }
      case "estimatedRecords":
        return (a.estimatedRecords - b.estimatedRecords) * direction;
      case "processedRecords":
        return (a.processedRecords - b.processedRecords) * direction;
      case "progressPercent":
        return (a.progressPercent - b.progressPercent) * direction;
      case "durationMs":
        return ((a.durationMs ?? 0) - (b.durationMs ?? 0)) * direction;
      case "createdAt":
      default:
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
        );
    }
  });
}

export function applyQueueJobFilters(
  jobs: QueueJobView[],
  params: QueueFilterParams = {},
): QueueListResult {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? 10;
  const sortField = params.sortField ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";

  const filtered = filterJobs(jobs, params);
  const sorted = sortJobs(filtered, sortField, sortDirection);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    jobs: sorted.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function getQueueStatusLabel(status: ExtractionJobDocument["status"]): string {
  const labels: Record<ExtractionJobDocument["status"], string> = {
    waiting: "Waiting",
    queued: "Queued",
    running: "Running",
    paused: "Paused",
    completed: "Completed",
    failed: "Failed",
    cancelled: "Cancelled",
    retrying: "Retrying",
  };
  return labels[status];
}

export function getQueuePriorityLabel(priority: ExtractionJobDocument["priority"]): string {
  const labels: Record<ExtractionJobDocument["priority"], string> = {
    low: "Low",
    normal: "Normal",
    high: "High",
    critical: "Critical",
  };
  return labels[priority];
}

export function getQueuePlatformLabel(platform: ExtractionJobDocument["platform"]): string {
  const labels: Record<ExtractionJobDocument["platform"], string> = {
    instagram: "Instagram",
    google_places: "Google Places",
    website: "Website",
    tiktok: "TikTok",
    youtube: "YouTube",
  };
  return labels[platform];
}

export { calculateProgress, formatDuration };

export async function getQueueDashboardData(): Promise<QueueDashboardData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const jobs = await loadExtractionJobs();
  const importJobMap = await loadImportJobMap();
  const views = jobs.map((job) => toJobView(job, importJobMap));

  return {
    stats: computeStats(jobs),
    jobs: views,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    warning: useFirestore ? undefined : MOCK_MODE_WARNING,
  };
}

export async function getQueueJobDetail(jobId: string): Promise<QueueJobDetailData | null> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();

  let job: ExtractionJobDocument | null;
  if (isFirestoreAvailable()) {
    try {
      job = await fetchExtractionJob(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        job = mockQueueStore.getExtractionJob(jobId);
      } else {
        throw error;
      }
    }
  } else {
    seedQueueMockDataIfEmpty();
    job = mockQueueStore.getExtractionJob(jobId);
  }

  if (!job) return null;

  const importJobMap = await loadImportJobMap();
  const records = await loadExtractionRecords(jobId);
  const timeline = useFirestore
    ? buildTimelineFromJob(job)
    : mockQueueStore.getTimeline(jobId);

  return {
    job: toJobView(job, importJobMap),
    records,
    timeline,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
  };
}

function buildTimelineFromJob(job: ExtractionJobDocument): QueueTimelineEvent[] {
  const events: QueueTimelineEvent[] = [
    {
      id: `${job.id}_created`,
      timestamp: job.createdAt,
      status: "waiting",
      message: "Extraction job created",
      actor: job.createdBy,
    },
  ];

  if (job.startedAt) {
    events.push({
      id: `${job.id}_started`,
      timestamp: job.startedAt,
      status: "running",
      message: "Job started",
      actor: job.workerVersion ?? "worker",
    });
  }

  if (job.status === "paused") {
    events.push({
      id: `${job.id}_paused`,
      timestamp: job.startedAt ?? job.createdAt,
      status: "paused",
      message: "Job paused",
      actor: CREATED_BY,
    });
  }

  if (job.completedAt) {
    events.push({
      id: `${job.id}_completed`,
      timestamp: job.completedAt,
      status: job.status === "failed" ? "failed" : "completed",
      message: job.status === "failed" ? "Job failed" : "Job completed",
      actor: job.workerVersion ?? CREATED_BY,
    });
  }

  return events.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
  );
}

export async function createExtractionJobFromImportJob(
  importJobId: string,
): Promise<ExtractionJobWithRecords | null> {
  const importJob = await loadImportJob(importJobId);
  if (!importJob) return null;

  const importRecords = await loadImportRecordsForJob(importJobId);
  const validRecords = importRecords.filter((record) => record.status === "valid");
  const timestamp = new Date().toISOString();

  const jobInput = {
    importJobId,
    name: `Extraction — ${importJob.name}`,
    platform: mapPlatformFromSource(importJob.source),
    status: "waiting" as const,
    priority: "normal" as const,
    createdBy: CREATED_BY,
    createdAt: timestamp,
    startedAt: null,
    completedAt: null,
    estimatedRecords: validRecords.length,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    duplicateRecords: 0,
    workerVersion: null,
    notes: null,
  };

  const recordInputs = validRecords.map((record) => ({
    jobId: "",
    importRecordId: record.id,
    username: record.username,
    profileUrl: record.profileUrl,
    status: "waiting" as const,
    attempts: 0,
    startedAt: null,
    completedAt: null,
    lastError: null,
    workerId: null,
  }));

  if (isFirestoreAvailable()) {
    try {
      const job = await persistExtractionJob(jobInput);
      const records = await persistExtractionRecords(
        recordInputs.map((record) => ({ ...record, jobId: job.id })),
      );

      await writeLog("Extraction Job Created", {
        extractionJobId: job.id,
        importJobId,
        estimatedRecords: job.estimatedRecords,
      });

      return { ...job, records };
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return createMockExtractionJob(jobInput, recordInputs);
      }
      throw error;
    }
  }

  return createMockExtractionJob(jobInput, recordInputs);
}

function createMockExtractionJob(
  jobInput: Omit<ExtractionJobDocument, "id">,
  recordInputs: Omit<ExtractionRecordDocument, "id">[],
): ExtractionJobWithRecords {
  const job = mockQueueStore.createExtractionJob(jobInput);
  const records = mockQueueStore.createExtractionRecords(
    recordInputs.map((record) => ({ ...record, jobId: job.id })),
  );

  mockQueueStore.addTimelineEvent(job.id, {
    timestamp: job.createdAt,
    status: "waiting",
    message: "Extraction job created from import job",
    actor: CREATED_BY,
  });

  return { ...job, records };
}

function resolveStatusFromAction(
  action: QueueAction,
  current: ExtractionJobDocument["status"],
): ExtractionJobDocument["status"] {
  switch (action) {
    case "queue":
      return "queued";
    case "pause":
      return "paused";
    case "resume":
      return current === "paused" ? "running" : "queued";
    case "cancel":
      return "cancelled";
    case "retry":
      return "retrying";
    default:
      return current;
  }
}

export async function performQueueAction(
  jobId: string,
  payload: QueueActionPayload,
): Promise<{ success: boolean; error?: string }> {
  const jobs = await loadExtractionJobs();
  const job = jobs.find((entry) => entry.id === jobId);
  if (!job) return { success: false, error: "Extraction job not found." };

  try {
    const updates: Partial<ExtractionJobDocument> = {};

    if (payload.action === "set_priority" && payload.priority) {
      updates.priority = payload.priority;
    } else if (payload.action !== "reorder") {
      updates.status = resolveStatusFromAction(payload.action, job.status);
    }

    if (isFirestoreAvailable()) {
      try {
        await persistUpdateExtractionJob(jobId, updates);
      } catch (error) {
        if (error instanceof FirestoreNotConfiguredError) {
          mockQueueStore.updateExtractionJob(jobId, updates);
        } else {
          throw error;
        }
      }
    } else {
      mockQueueStore.updateExtractionJob(jobId, updates);
    }

    if (updates.status) {
      const message = `${payload.action} action applied (UI only — no worker execution)`;
      if (!isFirestoreAvailable()) {
        mockQueueStore.addTimelineEvent(jobId, {
          timestamp: new Date().toISOString(),
          status: updates.status,
          message,
          actor: CREATED_BY,
        });
      }
    }

    await writeLog("Queue Action", { jobId, action: payload.action, ...updates });

    return { success: true };
  } catch (error) {
    return { success: false, error: getErrorMessage(error) };
  }
}

export function formatQueueDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoDate));
}
