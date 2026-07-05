import type { MatchReason } from "./duplicates";

export const CSV_IMPORT_JOB_STATUSES = [
  "draft",
  "mapping",
  "validating",
  "ready",
  "importing",
  "completed",
  "failed",
  "cancelled",
] as const;

export type CsvImportJobStatus = (typeof CSV_IMPORT_JOB_STATUSES)[number];

export const CSV_VALIDATION_STATUSES = [
  "valid",
  "invalid",
  "duplicate",
  "warning",
] as const;

export type CsvValidationStatus = (typeof CSV_VALIDATION_STATUSES)[number];

export const CSV_TARGET_FIELDS = [
  "name",
  "type",
  "category",
  "country",
  "state",
  "city",
  "area",
  "address",
  "lat",
  "lng",
  "instagram",
  "facebook",
  "tiktok",
  "youtube",
  "website",
  "email",
  "phone",
  "description",
  "tags",
  "source_url",
  "status",
] as const;

export type CsvTargetField = (typeof CSV_TARGET_FIELDS)[number];

export type CsvFieldMapping = Partial<Record<CsvTargetField, string>>;

export interface CsvMappedRow {
  name: string | null;
  type: string | null;
  category: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  area: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  instagram: string | null;
  facebook: string | null;
  tiktok: string | null;
  youtube: string | null;
  website: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  tags: string[];
  source_url: string | null;
  status: string | null;
}

export interface CsvDuplicateMatch {
  matchedId: string;
  matchedName: string;
  matchFields: string[];
  confidenceScore: number;
  reasons: MatchReason[];
}

export interface CsvImportJobDocument {
  id: string;
  fileName: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  status: CsvImportJobStatus;
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  mappedFields: CsvFieldMapping;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  notes: string | null;
  importJobId: string | null;
}

export type CreateCsvImportJobInput = Omit<CsvImportJobDocument, "id">;

export interface CsvImportRecordDocument {
  id: string;
  jobId: string;
  rowNumber: number;
  rawData: Record<string, string>;
  mappedData: CsvMappedRow;
  validationStatus: CsvValidationStatus;
  errors: string[];
  warnings: string[];
  duplicateMatches: CsvDuplicateMatch[];
  normalizedRecordId: string | null;
  reviewRecordId: string | null;
  createdAt: string;
  updatedAt: string;
}

export type CreateCsvImportRecordInput = Omit<CsvImportRecordDocument, "id">;

export interface CsvParseResult {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

export interface CsvValidationSummary {
  totalRows: number;
  validRows: number;
  invalidRows: number;
  duplicateRows: number;
  warningRows: number;
}

export interface CsvImportPreviewRow {
  rowNumber: number;
  mappedData: CsvMappedRow;
  validationStatus: CsvValidationStatus;
  errors: string[];
  warnings: string[];
  duplicateMatches: CsvDuplicateMatch[];
}

export interface CsvImportPageData {
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  warning?: string;
}

export interface CsvImportJobDetailData extends CsvImportPageData {
  job: CsvImportJobDocument;
  records: CsvImportRecordDocument[];
  summary: CsvValidationSummary;
}

export interface CsvImportHistoryData extends CsvImportPageData {
  jobs: CsvImportJobDocument[];
}

export interface CsvImportResult {
  job: CsvImportJobDocument;
  records: CsvImportRecordDocument[];
  importJobId: string | null;
  normalizedCount: number;
  reviewCount: number;
}
