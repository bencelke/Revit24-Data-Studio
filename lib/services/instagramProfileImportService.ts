import { MOCK_DISCOVERY_TARGETS } from "@/lib/mock-data/discoveryTargets";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createInstagramProfileImportJob as persistInstagramProfileImportJob,
  findExistingRecordsByUsernames,
  getInstagramProfileImportJob as fetchInstagramProfileImportJob,
  listInstagramProfileImportJobs as fetchInstagramProfileImportJobs,
  listInstagramProfileImportRecords,
  FirestoreNotConfiguredError,
} from "@/lib/repositories/instagramProfileImportRepository";
import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import { getImportJobs as getMockImportJobsList } from "@/lib/services/importService";
import type { ImportJob } from "@/lib/types/imports";
import type {
  CreateInstagramImportJobResult,
  DiscoveryTarget,
  ImportHistoryData,
  InstagramProfileBulkParseResult,
  InstagramProfileImportJob,
  InstagramProfileImportRecord,
  InstagramProfileInput,
} from "@/lib/types/instagram-imports";

const CREATED_BY = "system-dev";

const mockInstagramProfileJobs: InstagramProfileImportJob[] = [];

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function recalculateSummary(rows: InstagramProfileInput[]) {
  return {
    totalLines: rows.length,
    validProfiles: rows.filter((row) => row.status === "valid").length,
    duplicates: rows.filter((row) => row.status === "duplicate").length,
    invalidRows: rows.filter((row) => row.status === "invalid").length,
  };
}

async function applyExistingRecordDuplicates(
  parseResult: InstagramProfileBulkParseResult,
): Promise<InstagramProfileBulkParseResult> {
  const candidateUsernames = parseResult.rows
    .filter((row) => row.status === "valid" && row.username)
    .map((row) => row.username as string);

  if (candidateUsernames.length === 0 || !isFirebaseConfigured()) {
    return parseResult;
  }

  try {
    const existingRecords = await findExistingRecordsByUsernames(candidateUsernames);
    const rows = parseResult.rows.map((row) => {
      if (row.status !== "valid" || !row.username) {
        return row;
      }

      const match = existingRecords.get(row.username.toLowerCase());

      if (!match) {
        return row;
      }

      return {
        ...row,
        status: "duplicate" as const,
        error: "Username already exists in import records.",
        duplicateOf: match.id,
      };
    });

    return {
      rows,
      summary: recalculateSummary(rows),
    };
  } catch {
    return parseResult;
  }
}

function buildJobAndRecords(
  name: string,
  parseResult: InstagramProfileBulkParseResult,
): {
  job: Omit<InstagramProfileImportJob, "id">;
  records: Omit<InstagramProfileImportRecord, "id">[];
} {
  const timestamp = new Date().toISOString();
  const jobId = generateId("ig_job");

  const records: Omit<InstagramProfileImportRecord, "id">[] = parseResult.rows.map(
    (row) => ({
      jobId,
      originalInput: row.originalInput,
      username: row.username,
      profileUrl: row.profileUrl,
      status: row.status,
      error: row.error,
      duplicateOf: row.duplicateOf,
      createdAt: timestamp,
      updatedAt: timestamp,
    }),
  );

  const summary = recalculateSummary(parseResult.rows);

  const job: Omit<InstagramProfileImportJob, "id"> = {
    name,
    type: "instagram_profile_links",
    source: "instagram",
    status: summary.validProfiles > 0 ? "queued" : "draft",
    createdBy: CREATED_BY,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalRecords: summary.totalLines,
    validRecords: summary.validProfiles,
    duplicateRecords: summary.duplicates,
    invalidRecords: summary.invalidRows,
    notes: null,
  };

  return { job, records };
}

function saveMockJob(
  job: Omit<InstagramProfileImportJob, "id">,
  records: Omit<InstagramProfileImportRecord, "id">[],
): InstagramProfileImportJob {
  const jobId = generateId("ig_job");
  const persistedRecords: InstagramProfileImportRecord[] = records.map((record) => ({
    ...record,
    id: generateId("ig_rec"),
    jobId,
  }));

  const persistedJob: InstagramProfileImportJob = {
    ...job,
    id: jobId,
    records: persistedRecords,
  };

  mockInstagramProfileJobs.unshift(persistedJob);
  return persistedJob;
}

export function isInstagramImportFirestoreAvailable(): boolean {
  return isFirebaseConfigured();
}

export function parseAndPrepareBulkInput(text: string): InstagramProfileBulkParseResult {
  return parseInstagramBulkInput(text);
}

export async function createInstagramProfileImportJobFromText(
  text: string,
  name?: string,
): Promise<CreateInstagramImportJobResult> {
  const parsed = parseInstagramBulkInput(text);
  const enriched = await applyExistingRecordDuplicates(parsed);

  const jobName =
    name ??
    (enriched.summary.validProfiles > 0
      ? `Instagram Profiles — ${enriched.summary.validProfiles} links`
      : "Instagram Profiles — Draft");

  const { job, records } = buildJobAndRecords(jobName, enriched);

  if (isFirebaseConfigured()) {
    try {
      const jobId = await persistInstagramProfileImportJob(job, records);
      const persistedJob: InstagramProfileImportJob = { ...job, id: jobId };
      const persistedRecords: InstagramProfileImportRecord[] = records.map(
        (record, index) => ({
          ...record,
          id: `${jobId}_rec_${index}`,
          jobId,
        }),
      );

      return {
        job: persistedJob,
        records: persistedRecords,
        dataMode: "firestore",
      };
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return createMockJobResult(job, records);
      }

      throw error;
    }
  }

  return createMockJobResult(job, records);
}

function createMockJobResult(
  job: Omit<InstagramProfileImportJob, "id">,
  records: Omit<InstagramProfileImportRecord, "id">[],
): CreateInstagramImportJobResult {
  const persistedJob = saveMockJob(job, records);

  return {
    job: persistedJob,
    records: persistedJob.records ?? [],
    dataMode: "mock",
    warning:
      "Firestore is not configured. This import job was saved locally and will not persist after restart.",
  };
}

export async function getInstagramProfileImportJobWithRecords(
  jobId: string,
): Promise<InstagramProfileImportJob | null> {
  if (isFirebaseConfigured()) {
    try {
      const job = await fetchInstagramProfileImportJob(jobId);

      if (!job) {
        return getMockInstagramProfileImportJobById(jobId);
      }

      const records = await listInstagramProfileImportRecords(jobId);
      return { ...job, records };
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return getMockInstagramProfileImportJobById(jobId);
      }

      throw error;
    }
  }

  return getMockInstagramProfileImportJobById(jobId);
}

export async function listInstagramProfileImportJobsForHistory(): Promise<
  InstagramProfileImportJob[]
> {
  if (isFirebaseConfigured()) {
    try {
      return await fetchInstagramProfileImportJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return getInstagramProfileImportJobs();
      }

      throw error;
    }
  }

  return getInstagramProfileImportJobs();
}

export function mapInstagramJobToImportJob(
  job: InstagramProfileImportJob,
): ImportJob {
  return {
    id: job.id,
    name: job.name,
    type: "instagram",
    source: "instagram",
    status: job.status,
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

export async function getImportHistoryData(
  filters?: Parameters<typeof getMockImportJobsList>[0],
): Promise<ImportHistoryData> {
  const firebaseConfigured = isFirebaseConfigured();

  if (firebaseConfigured) {
    try {
      const instagramJobs = await fetchInstagramProfileImportJobs();
      const jobs = instagramJobs.map(mapInstagramJobToImportJob);

      return {
        jobs,
        dataMode: "firestore",
        firebaseConfigured: true,
      };
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) {
        throw error;
      }
    }
  }

  const mockResult = getMockImportJobsList(filters);

  return {
    jobs: mockResult.jobs,
    dataMode: "mock",
    firebaseConfigured: false,
  };
}

export function getInstagramProfileImportJobs(): InstagramProfileImportJob[] {
  return [...mockInstagramProfileJobs];
}

export function getMockInstagramProfileImportJobById(
  id: string,
): InstagramProfileImportJob | null {
  return mockInstagramProfileJobs.find((job) => job.id === id) ?? null;
}

/** @deprecated Use createInstagramProfileImportJobFromText */
export function createInstagramProfileImportJob(
  name: string,
  parseResult: InstagramProfileBulkParseResult,
  createdBy = CREATED_BY,
): InstagramProfileImportJob {
  const { job, records } = buildJobAndRecords(name, parseResult);
  return saveMockJob({ ...job, createdBy }, records);
}

/** @deprecated Use getInstagramProfileImportJobWithRecords */
export function getInstagramProfileImportJobById(
  id: string,
): InstagramProfileImportJob | null {
  return getMockInstagramProfileImportJobById(id);
}

export function getDiscoveryTargets(): DiscoveryTarget[] {
  return MOCK_DISCOVERY_TARGETS;
}

export function getDiscoveryPlatformLabel(
  platform: DiscoveryTarget["platform"],
): string {
  const labels: Record<DiscoveryTarget["platform"], string> = {
    instagram: "Instagram",
    google_places: "Google Places",
    website: "Website",
    tiktok: "TikTok",
    youtube: "YouTube",
  };

  return labels[platform];
}

export function getDiscoveryQueryTypeLabel(
  queryType: DiscoveryTarget["queryType"],
): string {
  const labels: Record<DiscoveryTarget["queryType"], string> = {
    topic: "Topic",
    location: "Location",
    hashtag: "Hashtag",
    keyword: "Keyword",
    business_category: "Business Category",
  };

  return labels[queryType];
}

export function getDiscoveryStatusLabel(
  status: DiscoveryTarget["status"],
): string {
  const labels: Record<DiscoveryTarget["status"], string> = {
    planned: "Planned",
    researching: "Researching",
    ready: "Ready",
    archived: "Archived",
  };

  return labels[status];
}
