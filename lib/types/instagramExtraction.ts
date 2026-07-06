export const EXTRACTION_STATUSES = ["pending", "completed", "failed", "mock"] as const;

export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

export const UPLOAD_STATUSES = ["not_uploaded", "uploaded", "duplicate", "failed"] as const;

export type UploadStatus = (typeof UPLOAD_STATUSES)[number];

export type ExtractorMode = "live" | "mock";
export type StorageMode = "live" | "mock";

export interface ParsedInstagramRow {
  lineNumber: number;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  validationStatus: "valid" | "duplicate" | "invalid";
  validationError: string | null;
}

export interface InstagramParseSummary {
  total: number;
  valid: number;
  duplicate: number;
  invalid: number;
}

export interface InstagramExtractionDocument {
  id: string;
  source: "instagram";
  username: string;
  profileUrl: string;
  profileImageUrl: string | null;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  status: ExtractionStatus;
  error: string | null;
  extractedAt: string;
  createdAt: string;
  updatedAt: string;
}

export type CreateInstagramExtractionInput = Omit<InstagramExtractionDocument, "id">;

/** UI and API alias for stored extraction rows. */
export type ExtractedInstagramProfile = InstagramExtractionDocument;

export interface InstagramExtractionRunSummary {
  total: number;
  succeeded: number;
  failed: number;
  saved: number;
  updated: number;
  storageMode: StorageMode;
}

export interface InstagramExtractionProgress {
  current: number;
  total: number;
  username: string;
  succeeded: number;
  failed: number;
  statusMessage: string;
}

export interface ExtractorPageData {
  firebaseConnected: boolean;
  storageMode: StorageMode;
  extractorMode: ExtractorMode;
  extractionEnabled: boolean;
  extractionDelayMs: number;
}

export interface ExtractorSettingsData {
  firebaseConnected: boolean;
  firebaseStatus: "Connected" | "Missing" | "Error";
  firebaseProjectId: string | null;
  missingFirebaseEnvVars: string[];
  storageMode: StorageMode;
  mode: "Live" | "Mock";
  extractionEnabled: boolean;
  extractionDelayMs: number;
  extractionMaxRetries: number;
  importQueueCollection: string;
  deployment: string;
}
