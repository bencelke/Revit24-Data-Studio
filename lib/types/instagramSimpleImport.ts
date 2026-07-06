export const INSTAGRAM_SIMPLE_EXTRACTION_STATUSES = [
  "pending",
  "extracting",
  "completed",
  "failed",
  "mock",
] as const;

export type InstagramSimpleExtractionStatus =
  (typeof INSTAGRAM_SIMPLE_EXTRACTION_STATUSES)[number];

export const REVIT24_IMPORT_QUEUE_STATUSES = ["pending_review"] as const;

export type Revit24ImportQueueStatus = (typeof REVIT24_IMPORT_QUEUE_STATUSES)[number];

export interface InstagramSimpleParsedRow {
  lineNumber: number;
  originalInput: string;
  username: string | null;
  profileUrl: string | null;
  validationStatus: "valid" | "duplicate" | "invalid";
  validationError: string | null;
}

export interface InstagramSimpleImportSummary {
  totalLinks: number;
  valid: number;
  duplicates: number;
  invalid: number;
  extracted: number;
  failed: number;
}

export interface InstagramSimpleExtractedRow {
  id: string;
  username: string;
  profileUrl: string;
  displayName: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  extractionStatus: InstagramSimpleExtractionStatus;
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
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  status: Revit24ImportQueueStatus;
  createdAt: string;
  updatedAt: string;
}

export type CreateRevit24ImportQueueInput = Omit<Revit24ImportQueueDocument, "id">;

export interface InstagramSimpleImportPageData {
  firebaseConfigured: boolean;
  dataMode: "firestore" | "mock";
  extractionLive: boolean;
}
