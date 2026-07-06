export const EXTRACTION_STATUSES = ["pending", "completed", "failed", "mock"] as const;

export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

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
  extracted: number;
  saved: number;
  duplicateSkipped: number;
  failed: number;
  duplicateUsernames: string[];
  storageMode: StorageMode;
}

export interface ExtractorPageData {
  firebaseConnected: boolean;
  storageMode: StorageMode;
  extractorMode: ExtractorMode;
  extractionEnabled: boolean;
}

export interface ExtractorSettingsData {
  firebaseConnected: boolean;
  firebaseStatus: "Connected" | "Not Connected";
  storageMode: StorageMode;
  mode: "Live" | "Mock";
  extractionEnabled: boolean;
  extractionDelayMs: number;
  extractionMaxRetries: number;
}
