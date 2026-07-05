export const IMPORT_STATUSES = [
  "draft",
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "pending_review",
] as const;

export const IMPORT_TYPES = [
  "instagram",
  "google_places",
  "public_website",
  "csv_upload",
  "manual_entry",
  "browser_extension",
  "api_import",
] as const;

export const IMPORT_SOURCES = [
  "instagram",
  "google_places",
  "website",
  "csv",
  "manual",
  "browser_extension",
  "api",
] as const;

export type ImportStatus = (typeof IMPORT_STATUSES)[number];
export type ImportType = (typeof IMPORT_TYPES)[number];
export type ImportSource = (typeof IMPORT_SOURCES)[number];

export type ImportTypeAvailability = "available" | "coming_soon";

export interface ImportJob {
  id: string;
  name: string;
  type: ImportType;
  source: ImportSource;
  status: ImportStatus;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  duration: string | null;
  totalRecords: number;
  importedRecords: number;
  duplicateRecords: number;
  failedRecords: number;
}

export interface ImportTypeDefinition {
  type: ImportType;
  title: string;
  description: string;
  availability: ImportTypeAvailability;
  futureLabel?: string;
}

export interface ImportSummary {
  totalImports: number;
  running: number;
  pendingReview: number;
  completedToday: number;
  failedToday: number;
}

export type ImportSortField =
  | "name"
  | "source"
  | "type"
  | "status"
  | "totalRecords"
  | "createdAt"
  | "duration";

export type ImportSortDirection = "asc" | "desc";

export interface ImportFilterParams {
  search?: string;
  status?: ImportStatus | "all";
  source?: ImportSource | "all";
  sortField?: ImportSortField;
  sortDirection?: ImportSortDirection;
  page?: number;
  pageSize?: number;
}

export interface ImportListResult {
  jobs: ImportJob[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ImportTimelineEvent {
  id: string;
  label: string;
  timestamp: string | null;
  status: "completed" | "current" | "upcoming" | "failed";
}

export interface ImportJobDetail extends ImportJob {
  timeline: ImportTimelineEvent[];
}
