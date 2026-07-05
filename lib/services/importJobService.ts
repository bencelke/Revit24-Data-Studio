import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import {
  createAppLog as persistAppLog,
  listRecentAppLogs,
} from "@/lib/repositories/appLogsRepository";
import {
  createImportJob as persistImportJob,
  getImportJob as fetchImportJob,
  listImportJobs as fetchImportJobs,
  updateImportJob as persistUpdateImportJob,
} from "@/lib/repositories/importJobsRepository";
import {
  createImportRecords as persistImportRecords,
  findExistingRecordsByUsernames as fetchExistingByUsernames,
  listImportRecords as fetchImportRecords,
} from "@/lib/repositories/importRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { mockImportJobStore } from "@/lib/mock-data/importJobStore";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { getErrorMessage } from "@/lib/errors/app-errors";
import type {
  AppLogEntry,
  CreateAppLogInput,
  CreateImportJobResult,
  ImportHistoryData,
  ImportJobDashboardStats,
  ImportJobDocument,
  ImportJobWithRecords,
  ImportRecordDocument,
  InstagramProfileBulkParseResult,
  InstagramProfileInput,
} from "@/lib/types/import-jobs";
import { createDefaultReviewFields } from "@/lib/types/review";
import type { ImportJob, ImportStatus as LegacyImportStatus } from "@/lib/types/imports";
import { getImportJobs as getMockLegacyImportJobs } from "@/lib/services/importService";

const CREATED_BY = "system-dev";
const INSTAGRAM_JOB_TYPE = "instagram_profile_links";
const INSTAGRAM_SOURCE = "instagram";

function recalculateSummary(rows: InstagramProfileInput[]) {
  return {
    totalLines: rows.length,
    validProfiles: rows.filter((row) => row.status === "valid").length,
    duplicates: rows.filter((row) => row.status === "duplicate").length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
  };
}

async function writeLog(input: Omit<CreateAppLogInput, "timestamp" | "user">): Promise<void> {
  const entry: CreateAppLogInput = {
    timestamp: new Date().toISOString(),
    user: CREATED_BY,
    ...input,
  };

  if (!isFirestoreAvailable()) return;

  try {
    await persistAppLog(entry);
  } catch {
    // Logging must never break user flows.
  }
}

async function applyExistingRecordDuplicates(
  parseResult: InstagramProfileBulkParseResult,
  useFirestore: boolean,
): Promise<InstagramProfileBulkParseResult> {
  const candidateUsernames = parseResult.rows
    .filter((row) => row.status === "valid" && row.username)
    .map((row) => row.username as string);

  if (candidateUsernames.length === 0) {
    return parseResult;
  }

  try {
    const existingRecords = useFirestore
      ? await fetchExistingByUsernames(candidateUsernames)
      : mockImportJobStore.findExistingRecordsByUsernames(candidateUsernames);

    const rows = parseResult.rows.map((row) => {
      if (row.status !== "valid" || !row.username) return row;

      const match = existingRecords.get(row.username.toLowerCase());
      if (!match) return row;

      return {
        ...row,
        status: "duplicate" as const,
        error: "Username already exists in import records.",
        duplicateOf: match.id,
      };
    });

    return { rows, summary: recalculateSummary(rows) };
  } catch (error) {
    await writeLog({
      event: "Repository Error",
      level: "error",
      details: { action: "duplicate_detection", message: getErrorMessage(error) },
    });
    return parseResult;
  }
}

function buildJobInput(
  name: string,
  parseResult: InstagramProfileBulkParseResult,
): Omit<ImportJobDocument, "id"> {
  const timestamp = new Date().toISOString();
  const summary = recalculateSummary(parseResult.rows);

  return {
    name,
    type: INSTAGRAM_JOB_TYPE,
    source: INSTAGRAM_SOURCE,
    status: summary.validProfiles > 0 ? "queued" : "draft",
    createdBy: CREATED_BY,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalRecords: summary.totalLines,
    validRecords: summary.validProfiles,
    duplicateRecords: summary.duplicates,
    invalidRecords: summary.invalidRows,
    notes: null,
    metadata: { inputType: "instagram_bulk" },
  };
}

function buildRecordInputs(
  jobId: string,
  parseResult: InstagramProfileBulkParseResult,
): Omit<ImportRecordDocument, "id">[] {
  const timestamp = new Date().toISOString();

  return parseResult.rows.map((row) => ({
    jobId,
    originalInput: row.originalInput,
    username: row.username,
    profileUrl: row.profileUrl,
    status: row.status,
    error: row.error,
    duplicateOf: row.duplicateOf,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...createDefaultReviewFields(row.status, INSTAGRAM_SOURCE),
  }));
}

export function isImportFirestoreAvailable(): boolean {
  return isFirebaseConfigured();
}

export async function createImportJobFromText(
  text: string,
  name?: string,
): Promise<CreateImportJobResult> {
  const parsed = parseInstagramBulkInput(text);
  return createImportJobFromBulkInput(parsed, name);
}

export async function createImportJobFromBulkInput(
  parseResult: InstagramProfileBulkParseResult,
  name?: string,
): Promise<CreateImportJobResult> {
  const useFirestore = isFirestoreAvailable();
  const enriched = await applyExistingRecordDuplicates(parseResult, useFirestore);

  const jobName =
    name ??
    (enriched.summary.validProfiles > 0
      ? `Instagram Profiles — ${enriched.summary.validProfiles} links`
      : "Instagram Profiles — Draft");

  const jobInput = buildJobInput(jobName, enriched);

  if (useFirestore) {
    try {
      const job = await persistImportJob(jobInput);
      const recordInputs = buildRecordInputs(job.id, enriched);
      const records = await persistImportRecords(recordInputs);

      await writeLog({
        event: "Job Created",
        level: "info",
        details: { jobId: job.id, name: job.name, totalRecords: job.totalRecords },
      });

      await writeLog({
        event: "Records Imported",
        level: "info",
        details: { jobId: job.id, count: records.length },
      });

      return { job, records, dataMode: "firestore" };
    } catch (error) {
      await writeLog({
        event: "Repository Error",
        level: "error",
        details: { action: "create_import_job", message: getErrorMessage(error) },
      });

      if (error instanceof FirestoreNotConfiguredError) {
        return createMockImportJob(jobInput, enriched);
      }

      throw error;
    }
  }

  return createMockImportJob(jobInput, enriched);
}

function createMockImportJob(
  jobInput: Omit<ImportJobDocument, "id">,
  parseResult: InstagramProfileBulkParseResult,
): CreateImportJobResult {
  const job = mockImportJobStore.createImportJob(jobInput);
  const recordInputs = buildRecordInputs(job.id, parseResult);
  const records = mockImportJobStore.createImportRecords(recordInputs);

  return {
    job,
    records,
    dataMode: "mock",
    warning: MOCK_MODE_WARNING,
  };
}

export async function getImportJobWithRecords(
  jobId: string,
): Promise<ImportJobWithRecords | null> {
  if (isFirestoreAvailable()) {
    try {
      const job = await fetchImportJob(jobId);
      if (!job) return getMockImportJobWithRecords(jobId);

      const records = await fetchImportRecords(jobId);
      return { ...job, records };
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return getMockImportJobWithRecords(jobId);
      }
      throw error;
    }
  }

  return getMockImportJobWithRecords(jobId);
}

function getMockImportJobWithRecords(jobId: string): ImportJobWithRecords | null {
  const job = mockImportJobStore.getImportJob(jobId);
  if (!job) return null;

  return {
    ...job,
    records: mockImportJobStore.listImportRecords(jobId),
  };
}

export async function listImportJobsForHistory(): Promise<ImportJobDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchImportJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockImportJobStore.listImportJobs();
      }
      throw error;
    }
  }

  return mockImportJobStore.listImportJobs();
}

export async function updateImportJobStatus(
  jobId: string,
  status: ImportJobDocument["status"],
): Promise<void> {
  if (isFirestoreAvailable()) {
    await persistUpdateImportJob(jobId, { status });
    return;
  }

  mockImportJobStore.updateImportJob(jobId, { status, updatedAt: new Date().toISOString() });
}

export function mapImportJobDocumentToLegacyJob(job: ImportJobDocument): ImportJob {
  return {
    id: job.id,
    name: job.name,
    type: "instagram",
    source: "instagram",
    status: job.status as LegacyImportStatus,
    createdBy: job.createdBy,
    createdAt: job.createdAt,
    startedAt: null,
    completedAt: null,
    duration: null,
    totalRecords: job.totalRecords,
    importedRecords: job.validRecords,
    duplicateRecords: job.duplicateRecords,
    failedRecords: job.invalidRecords,
  };
}

export async function getImportHistoryData(): Promise<ImportHistoryData> {
  const firebaseConfigured = isFirebaseConfigured();

  if (isFirestoreAvailable()) {
    try {
      const jobs = (await fetchImportJobs()).map(mapImportJobDocumentToLegacyJob);
      return { jobs, dataMode: "firestore", firebaseConfigured: true };
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) {
        await writeLog({
          event: "Repository Error",
          level: "error",
          details: { action: "list_import_jobs", message: getErrorMessage(error) },
        });
        throw error;
      }
    }
  }

  const firestoreJobs = mockImportJobStore.listImportJobs().map(mapImportJobDocumentToLegacyJob);

  if (firestoreJobs.length > 0) {
    return { jobs: firestoreJobs, dataMode: "mock", firebaseConfigured };
  }

  const mockResult = getMockLegacyImportJobs();
  return { jobs: mockResult.jobs, dataMode: "mock", firebaseConfigured };
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

export async function getImportJobDashboardStats(): Promise<ImportJobDashboardStats> {
  const jobs = await listImportJobsForHistory();

  return {
    totalImportJobs: jobs.length,
    pendingReview: jobs.filter((job) => job.status === "pending_review").length,
    queued: jobs.filter((job) => job.status === "queued").length,
    running: jobs.filter((job) => job.status === "running").length,
    completedToday: jobs.filter(
      (job) => job.status === "completed" && isToday(job.updatedAt),
    ).length,
    failedToday: jobs.filter(
      (job) => job.status === "failed" && isToday(job.updatedAt),
    ).length,
  };
}

export async function getRecentAppLogs(max = 10): Promise<AppLogEntry[]> {
  if (!isFirestoreAvailable()) return [];

  try {
    return await listRecentAppLogs(max);
  } catch {
    return [];
  }
}
