import { mockImportJobStore } from "@/lib/mock-data/importJobStore";
import { mockReviewStore } from "@/lib/mock-data/reviewStore";
import {
  FirestoreNotConfiguredError,
  MOCK_MODE_WARNING,
  getErrorMessage,
} from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { createAppLog } from "@/lib/repositories/appLogsRepository";
import {
  createApprovedRecord as persistApprovedRecord,
  listApprovedRecords as fetchApprovedRecords,
} from "@/lib/repositories/approvedRecordsRepository";
import {
  getImportRecord as fetchImportRecord,
  listAllImportRecords as fetchAllImportRecords,
  updateImportRecord as persistUpdateImportRecord,
} from "@/lib/repositories/importRecordsRepository";
import { listImportJobs as fetchImportJobs } from "@/lib/repositories/importJobsRepository";
import {
  createReviewHistoryEntry as persistReviewHistory,
  listReviewHistoryByRecordId as fetchReviewHistoryByRecordId,
  listRecentReviewHistory as fetchRecentReviewHistory,
} from "@/lib/repositories/reviewHistoryRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { formatImportDate } from "@/lib/services/importService";
import type { ImportJobDocument, ImportRecordDocument } from "@/lib/types/import-jobs";
import type {
  ApprovedRecordDocument,
  CreateApprovedRecordInput,
  CreateReviewHistoryInput,
  ReviewAction,
  ReviewActionPayload,
  ReviewActivityItem,
  ReviewDashboardData,
  ReviewDashboardStats,
  ReviewFilterParams,
  ReviewHistoryEntry,
  ReviewListResult,
  ReviewRecordDetailData,
  ReviewRecordNote,
  ReviewRecordStatus,
  ReviewRecordView,
  ReviewSortDirection,
  ReviewSortField,
} from "@/lib/types/review";
import { getDefaultReviewPermissions } from "@/lib/types/review";
import { seedReviewMockDataIfEmpty } from "@/lib/mock-data/reviewSeedData";

const DEFAULT_REVIEWER = "system-dev";
const DEFAULT_PAGE_SIZE = 10;

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
      user: DEFAULT_REVIEWER,
      details,
      level,
    });
  } catch {
    // Logging should not block review actions.
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

export function getReviewStatusLabel(status: ReviewRecordStatus): string {
  const labels: Record<ReviewRecordStatus, string> = {
    pending_review: "Pending Review",
    approved: "Approved",
    rejected: "Rejected",
    duplicate: "Duplicate",
    needs_edit: "Needs Edit",
    merged: "Merged",
  };
  return labels[status];
}

export function getReviewImportSourceLabel(source: string): string {
  const labels: Record<string, string> = {
    instagram: "Instagram",
    google_places: "Google Places",
    website: "Public Website",
    manual: "Manual Entry",
  };
  return labels[source] ?? source;
}

function extractNotesFromHistory(history: ReviewHistoryEntry[]): ReviewRecordNote[] {
  return history
    .filter((entry) => entry.notes && entry.notes.trim().length > 0)
    .map((entry) => ({
      reviewer: entry.reviewer,
      timestamp: entry.timestamp,
      message: entry.notes ?? "",
    }));
}

function mapRecordToView(
  record: ImportRecordDocument,
  jobMap: Map<string, ImportJobDocument>,
  history: ReviewHistoryEntry[] = [],
): ReviewRecordView {
  const job = jobMap.get(record.jobId);

  return {
    id: record.id,
    jobId: record.jobId,
    jobName: job?.name ?? "Unknown Job",
    originalInput: record.originalInput,
    username: record.username,
    profileUrl: record.profileUrl,
    validationStatus: record.status,
    error: record.error,
    duplicateOf: record.duplicateOf,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    reviewStatus: record.reviewStatus,
    displayName: record.displayName,
    importSource: record.importSource,
    reviewer: record.reviewer,
    website: record.website,
    publicEmail: record.publicEmail,
    tags: record.tags,
    country: record.country,
    city: record.city,
    description: record.description,
    notes: extractNotesFromHistory(history),
  };
}

async function loadJobsMap(): Promise<Map<string, ImportJobDocument>> {
  if (isFirestoreAvailable()) {
    try {
      const jobs = await fetchImportJobs();
      return new Map(jobs.map((job) => [job.id, job]));
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
    }
  }

  return new Map(mockImportJobStore.listImportJobs().map((job) => [job.id, job]));
}

async function loadAllRecords(): Promise<ImportRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchAllImportRecords();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockImportJobStore.listAllRecords();
      }
      throw error;
    }
  }

  seedReviewMockDataIfEmpty();
  return mockImportJobStore.listAllRecords();
}

async function loadRecordById(id: string): Promise<ImportRecordDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchImportRecord(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockImportJobStore.listAllRecords().find((record) => record.id === id) ?? null;
      }
      throw error;
    }
  }

  seedReviewMockDataIfEmpty();
  return mockImportJobStore.listAllRecords().find((record) => record.id === id) ?? null;
}

async function loadHistoryForRecord(recordId: string): Promise<ReviewHistoryEntry[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchReviewHistoryByRecordId(recordId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockReviewStore.listReviewHistoryByRecordId(recordId);
      }
      throw error;
    }
  }

  return mockReviewStore.listReviewHistoryByRecordId(recordId);
}

async function loadRecentHistory(max = 20): Promise<ReviewHistoryEntry[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchRecentReviewHistory(max);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockReviewStore.listRecentReviewHistory(max);
      }
      throw error;
    }
  }

  return mockReviewStore.listRecentReviewHistory(max);
}

async function loadApprovedRecords(): Promise<ApprovedRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchApprovedRecords();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockReviewStore.listApprovedRecords();
      }
      throw error;
    }
  }

  return mockReviewStore.listApprovedRecords();
}

function filterRecords(
  records: ReviewRecordView[],
  params: ReviewFilterParams,
): ReviewRecordView[] {
  const search = params.search?.trim().toLowerCase() ?? "";

  return records.filter((record) => {
    if (params.reviewStatus && params.reviewStatus !== "all") {
      if (record.reviewStatus !== params.reviewStatus) return false;
    }

    if (params.importSource && params.importSource !== "all") {
      if (record.importSource !== params.importSource) return false;
    }

    if (!search) return true;

    const haystack = [
      record.username,
      record.displayName,
      record.jobName,
      record.originalInput,
      record.reviewer,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    return haystack.includes(search);
  });
}

function sortRecords(
  records: ReviewRecordView[],
  sortField: ReviewSortField,
  sortDirection: ReviewSortDirection,
): ReviewRecordView[] {
  const sorted = [...records].sort((a, b) => {
    const direction = sortDirection === "asc" ? 1 : -1;

    switch (sortField) {
      case "username":
        return (a.username ?? "").localeCompare(b.username ?? "") * direction;
      case "displayName":
        return (a.displayName ?? "").localeCompare(b.displayName ?? "") * direction;
      case "importSource":
        return a.importSource.localeCompare(b.importSource) * direction;
      case "jobName":
        return a.jobName.localeCompare(b.jobName) * direction;
      case "reviewStatus":
        return a.reviewStatus.localeCompare(b.reviewStatus) * direction;
      case "reviewer":
        return (a.reviewer ?? "").localeCompare(b.reviewer ?? "") * direction;
      case "createdAt":
      default:
        return (
          (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * direction
        );
    }
  });

  return sorted;
}

export function applyReviewRecordFilters(
  records: ReviewRecordView[],
  params: ReviewFilterParams = {},
): ReviewListResult {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const sortField = params.sortField ?? "createdAt";
  const sortDirection = params.sortDirection ?? "desc";

  const filtered = filterRecords(records, params);
  const sorted = sortRecords(filtered, sortField, sortDirection);
  const total = sorted.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    records: sorted.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

function computeDashboardStats(
  records: ImportRecordDocument[],
  history: ReviewHistoryEntry[],
): ReviewDashboardStats {
  const pendingReview = records.filter(
    (record) => record.reviewStatus === "pending_review",
  ).length;
  const needsEdit = records.filter(
    (record) => record.reviewStatus === "needs_edit",
  ).length;
  const duplicates = records.filter(
    (record) => record.reviewStatus === "duplicate",
  ).length;

  const approvedToday = history.filter(
    (entry) => entry.newStatus === "approved" && isToday(entry.timestamp),
  ).length;
  const rejectedToday = history.filter(
    (entry) => entry.newStatus === "rejected" && isToday(entry.timestamp),
  ).length;

  const completedReviews = history.filter(
    (entry) =>
      entry.previousStatus === "pending_review" &&
      entry.newStatus !== "pending_review",
  );

  let averageReviewTimeMinutes = 0;
  if (completedReviews.length > 0) {
    const recordCreatedMap = new Map(
      records.map((record) => [record.id, new Date(record.createdAt).getTime()]),
    );

    const totalMinutes = completedReviews.reduce((sum, entry) => {
      const createdAt = recordCreatedMap.get(entry.recordId);
      if (!createdAt) return sum;
      const diffMs = new Date(entry.timestamp).getTime() - createdAt;
      return sum + diffMs / 60000;
    }, 0);

    averageReviewTimeMinutes = Math.round(totalMinutes / completedReviews.length);
  }

  return {
    pendingReview,
    approvedToday,
    rejectedToday,
    needsEdit,
    duplicates,
    averageReviewTimeMinutes,
  };
}

function historyToActivity(
  entry: ReviewHistoryEntry,
  record?: ImportRecordDocument,
): ReviewActivityItem {
  const target =
    record?.displayName ??
    (record?.username ? `@${record.username}` : record?.originalInput ?? entry.recordId);

  const actionLabels: Record<ReviewRecordStatus, string> = {
    pending_review: "updated",
    approved: "approved",
    rejected: "rejected",
    duplicate: "marked as duplicate",
    needs_edit: "marked as Needs Edit",
    merged: "merged",
  };

  const status: ReviewActivityItem["status"] =
    entry.newStatus === "rejected" || entry.newStatus === "duplicate"
      ? "warning"
      : entry.newStatus === "pending_review"
        ? "pending"
        : "success";

  return {
    id: entry.id,
    actor: entry.reviewer,
    action: actionLabels[entry.newStatus] ?? "updated",
    target,
    timestamp: entry.timestamp,
    status,
  };
}

export async function getReviewDashboardData(): Promise<ReviewDashboardData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const records = await loadAllRecords();
  const jobMap = await loadJobsMap();
  const history = await loadRecentHistory(50);
  const views = records.map((record) => mapRecordToView(record, jobMap));

  return {
    stats: computeDashboardStats(records, history),
    records: views.filter((record) => record.reviewStatus === "pending_review"),
    recentActivity: history
      .slice(0, 10)
      .map((entry) =>
        historyToActivity(entry, records.find((record) => record.id === entry.recordId)),
      ),
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    warning: useFirestore ? undefined : MOCK_MODE_WARNING,
  };
}

export async function getReviewRecordsList(
  defaultStatus?: ReviewRecordStatus | ReviewRecordStatus[],
): Promise<{
  records: ReviewRecordView[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
}> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const records = await loadAllRecords();
  const jobMap = await loadJobsMap();
  let views = records.map((record) => mapRecordToView(record, jobMap));

  if (defaultStatus) {
    const statuses = Array.isArray(defaultStatus) ? defaultStatus : [defaultStatus];
    views = views.filter((record) => statuses.includes(record.reviewStatus));
  }

  return {
    records: views,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
  };
}

export async function getReviewRecordDetail(
  recordId: string,
): Promise<ReviewRecordDetailData | null> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const record = await loadRecordById(recordId);
  if (!record) return null;

  const jobMap = await loadJobsMap();
  const history = await loadHistoryForRecord(recordId);

  return {
    record: mapRecordToView(record, jobMap, history),
    history,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    permissions: getDefaultReviewPermissions(),
  };
}

async function persistRecordUpdate(
  recordId: string,
  data: Partial<ImportRecordDocument>,
): Promise<ImportRecordDocument | null> {
  const timestamp = new Date().toISOString();

  if (isFirestoreAvailable()) {
    try {
      await persistUpdateImportRecord(recordId, { ...data, updatedAt: timestamp });
      return await fetchImportRecord(recordId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockImportJobStore.updateImportRecord(recordId, {
          ...data,
          updatedAt: timestamp,
        });
      }
      throw error;
    }
  }

  return mockImportJobStore.updateImportRecord(recordId, {
    ...data,
    updatedAt: timestamp,
  });
}

async function persistHistory(input: CreateReviewHistoryInput): Promise<ReviewHistoryEntry> {
  if (isFirestoreAvailable()) {
    try {
      return await persistReviewHistory(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockReviewStore.createReviewHistoryEntry(input);
      }
      throw error;
    }
  }

  return mockReviewStore.createReviewHistoryEntry(input);
}

async function persistApprovedRecordCopy(
  input: CreateApprovedRecordInput,
): Promise<ApprovedRecordDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistApprovedRecord(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockReviewStore.createApprovedRecord(input);
      }
      throw error;
    }
  }

  return mockReviewStore.createApprovedRecord(input);
}

function resolveNewStatus(
  action: ReviewAction,
  currentStatus: ReviewRecordStatus,
): ReviewRecordStatus {
  switch (action) {
    case "approve":
    case "approve_anyway":
      return "approved";
    case "reject":
      return "rejected";
    case "needs_edit":
      return "needs_edit";
    case "mark_duplicate":
      return "duplicate";
    case "merge_later":
      return currentStatus;
    case "ignore":
      return currentStatus;
    case "reopen":
      return "pending_review";
    case "save_notes":
      return currentStatus;
    default:
      return currentStatus;
  }
}

export async function performReviewAction(
  recordId: string,
  payload: ReviewActionPayload,
): Promise<{ success: boolean; error?: string }> {
  const reviewer = payload.reviewer ?? DEFAULT_REVIEWER;
  const record = await loadRecordById(recordId);

  if (!record) {
    return { success: false, error: "Record not found." };
  }

  const previousStatus = record.reviewStatus;
  const newStatus = resolveNewStatus(payload.action, previousStatus);
  const timestamp = new Date().toISOString();

  try {
    const updateData: Partial<ImportRecordDocument> = {
      reviewStatus: newStatus,
      reviewer,
    };

    if (payload.edits) {
      if (payload.edits.displayName !== undefined) {
        updateData.displayName = payload.edits.displayName;
      }
      if (payload.edits.username !== undefined) {
        updateData.username = payload.edits.username;
      }
      if (payload.edits.website !== undefined) {
        updateData.website = payload.edits.website;
      }
      if (payload.edits.publicEmail !== undefined) {
        updateData.publicEmail = payload.edits.publicEmail;
      }
      if (payload.edits.tags !== undefined) {
        updateData.tags = payload.edits.tags;
      }
      if (payload.edits.country !== undefined) {
        updateData.country = payload.edits.country;
      }
      if (payload.edits.city !== undefined) {
        updateData.city = payload.edits.city;
      }
      if (payload.edits.description !== undefined) {
        updateData.description = payload.edits.description;
      }
    }

    if (
      payload.action === "approve" ||
      payload.action === "approve_anyway"
    ) {
      await persistApprovedRecordCopy({
        importRecordId: record.id,
        jobId: record.jobId,
        username: updateData.username ?? record.username,
        profileUrl: record.profileUrl,
        displayName: updateData.displayName ?? record.displayName,
        importSource: record.importSource,
        website: updateData.website ?? record.website,
        publicEmail: updateData.publicEmail ?? record.publicEmail,
        tags: updateData.tags ?? record.tags,
        country: updateData.country ?? record.country,
        city: updateData.city ?? record.city,
        description: updateData.description ?? record.description,
        approvedBy: reviewer,
        approvedAt: timestamp,
        metadata: { originalInput: record.originalInput },
      });
    }

    if (payload.action !== "save_notes" && payload.action !== "ignore") {
      await persistRecordUpdate(recordId, updateData);
    } else if (payload.edits) {
      await persistRecordUpdate(recordId, updateData);
    }

    const historyNotes = payload.notes ?? payload.edits?.notes ?? null;
    const historyReason =
      payload.reason ??
      (payload.action === "merge_later"
        ? "merge_later"
        : payload.action === "ignore"
          ? "ignored"
          : payload.action);

    await persistHistory({
      recordId,
      previousStatus,
      newStatus,
      reviewer,
      timestamp,
      reason: historyReason,
      notes: historyNotes,
    });

    await writeLog("Review Action", {
      recordId,
      action: payload.action,
      previousStatus,
      newStatus,
      reviewer,
    });

    return { success: true };
  } catch (error) {
    await writeLog(
      "Review Action Failed",
      { recordId, action: payload.action, message: getErrorMessage(error) },
      "error",
    );
    return { success: false, error: getErrorMessage(error) };
  }
}

export async function getApprovedRecordsList(
  params: ReviewFilterParams = {},
): Promise<ReviewListResult & { approvedRecords: ApprovedRecordDocument[] }> {
  const approvedRecords = await loadApprovedRecords();
  const records = await loadAllRecords();
  const jobMap = await loadJobsMap();
  const approvedRecordIds = new Set(approvedRecords.map((record) => record.importRecordId));

  const views = records
    .filter((record) => approvedRecordIds.has(record.id))
    .map((record) => mapRecordToView(record, jobMap));

  return {
    ...applyReviewRecordFilters(views, params),
    approvedRecords,
  };
}

export { formatImportDate as formatReviewDate };
