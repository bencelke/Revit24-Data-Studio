export const IMPORT_JOB_STATUSES = [
  "draft",
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "pending_review",
] as const;

export const IMPORT_RECORD_STATUSES = [
  "valid",
  "duplicate",
  "invalid",
] as const;

export type ImportJobStatus = (typeof IMPORT_JOB_STATUSES)[number];
export type ImportRecordStatus = (typeof IMPORT_RECORD_STATUSES)[number];
export type ImportDataMode = "firestore" | "mock";

export interface ImportJobDocument {
  id: string;
  name: string;
  type: string;
  source: string;
  status: ImportJobStatus;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  totalRecords: number;
  validRecords: number;
  duplicateRecords: number;
  invalidRecords: number;
  notes: string | null;
  metadata: Record<string, unknown> | null;
}

import type { ReviewRecordFields } from "@/lib/types/review";

export interface ImportRecordDocument extends ReviewRecordFields {
  id: string;
  jobId: string;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  status: ImportRecordStatus;
  error: string | null;
  duplicateOf: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ImportJobWithRecords extends ImportJobDocument {
  records: ImportRecordDocument[];
}

export type CreateImportJobInput = Omit<ImportJobDocument, "id">;
export type CreateImportRecordInput = Omit<ImportRecordDocument, "id">;

export interface CreateImportJobResult {
  job: ImportJobDocument;
  records: ImportRecordDocument[];
  dataMode: ImportDataMode;
  warning?: string;
}

export interface ImportHistoryData {
  jobs: import("./imports").ImportJob[];
  dataMode: ImportDataMode;
  firebaseConfigured: boolean;
}

export interface ImportJobDashboardStats {
  totalImportJobs: number;
  pendingReview: number;
  queued: number;
  running: number;
  completedToday: number;
  failedToday: number;
}

export interface AppLogEntry {
  id: string;
  timestamp: string;
  event: string;
  user: string;
  details: Record<string, unknown>;
  level: "info" | "warning" | "error";
}

export type CreateAppLogInput = Omit<AppLogEntry, "id">;

// Instagram bulk input types (validation preview)
export interface InstagramProfileInput {
  lineNumber: number;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  status: ImportRecordStatus;
  error: string | null;
  duplicateOf: string | null;
}

export interface InstagramProfileInputSummary {
  totalLines: number;
  validProfiles: number;
  duplicates: number;
  invalidRows: number;
}

export interface InstagramProfileBulkParseResult {
  rows: InstagramProfileInput[];
  summary: InstagramProfileInputSummary;
}

export type InstagramProfileImportJob = ImportJobDocument;
export type InstagramProfileImportRecord = ImportRecordDocument;
export type CreateInstagramImportJobResult = CreateImportJobResult;
export type InstagramProfileInputStatus = ImportRecordStatus;
export const DISCOVERY_PLATFORMS = [
  "instagram",
  "google_places",
  "website",
  "tiktok",
  "youtube",
] as const;

export const DISCOVERY_QUERY_TYPES = [
  "topic",
  "location",
  "hashtag",
  "keyword",
  "business_category",
] as const;

export const DISCOVERY_TARGET_STATUSES = [
  "planned",
  "researching",
  "ready",
  "archived",
] as const;

export type DiscoveryPlatform = (typeof DISCOVERY_PLATFORMS)[number];
export type DiscoveryQueryType = (typeof DISCOVERY_QUERY_TYPES)[number];
export type DiscoveryTargetStatus = (typeof DISCOVERY_TARGET_STATUSES)[number];

export interface DiscoveryTarget {
  id: string;
  name: string;
  platform: DiscoveryPlatform;
  queryType: DiscoveryQueryType;
  query: string;
  country: string | null;
  city: string | null;
  tags: string[];
  status: DiscoveryTargetStatus;
  notes: string | null;
  createdAt: string;
}
