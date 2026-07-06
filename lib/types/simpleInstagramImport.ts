export const SIMPLE_EXTRACTION_STATUSES = [
  "pending",
  "completed",
  "failed",
  "mock",
] as const;

export type SimpleExtractionStatus = (typeof SIMPLE_EXTRACTION_STATUSES)[number];

export const REVIT24_IMPORT_QUEUE_STATUSES = ["pending_review"] as const;

export type Revit24ImportQueueStatus = (typeof REVIT24_IMPORT_QUEUE_STATUSES)[number];

export interface SimpleParsedRow {
  lineNumber: number;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  validationStatus: "valid" | "duplicate" | "invalid";
  validationError: string | null;
}

export interface SimpleParseSummary {
  total: number;
  valid: number;
  duplicate: number;
  invalid: number;
}

export interface SimpleExtractedProfile {
  id: string;
  username: string;
  profileUrl: string;
  displayName: string | null;
  profileImageUrl: string | null;
  publicEmail: string | null;
  status: SimpleExtractionStatus;
  error: string | null;
  extractedAt: string | null;
}

export interface Revit24ImportQueueDocument {
  id: string;
  source: "instagram";
  username: string;
  profileUrl: string;
  displayName: string | null;
  profileImageUrl: string | null;
  publicEmail: string | null;
  status: Revit24ImportQueueStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateRevit24ImportQueueInput = Omit<Revit24ImportQueueDocument, "id">;

export interface SimpleImportPageData {
  firebaseConfigured: boolean;
  dataMode: "firestore" | "mock";
  extractionLive: boolean;
}

export interface SimpleSettingsData {
  firebaseConfigured: boolean;
  dataMode: "firestore" | "mock";
  extractionEnabled: boolean;
  extractionDelayMs: number;
  extractionMaxRetries: number;
}

export interface UploadToRevit24Result {
  successCount: number;
  failedCount: number;
  duplicateCount: number;
  duplicateUsernames: string[];
  dataMode: "firestore" | "mock";
}
