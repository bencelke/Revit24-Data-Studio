export {
  EXTRACTION_STATUSES,
  type ExtractionStatus,
  type ExtractorMode,
  type ParsedInstagramRow,
  type InstagramParseSummary,
  type ExtractedInstagramProfile,
  type ExtractorPageData,
  type ExtractorSettingsData,
} from "@/lib/types/instagramExtraction";

// Legacy aliases for upload queue (next phase)
export const SIMPLE_EXTRACTION_STATUSES = ["pending", "completed", "failed", "mock"] as const;
export type SimpleExtractionStatus = (typeof SIMPLE_EXTRACTION_STATUSES)[number];

export const REVIT24_IMPORT_QUEUE_STATUSES = ["pending_review"] as const;
export type Revit24ImportQueueStatus = (typeof REVIT24_IMPORT_QUEUE_STATUSES)[number];

export type SimpleParsedRow = import("@/lib/types/instagramExtraction").ParsedInstagramRow;
export type SimpleParseSummary = import("@/lib/types/instagramExtraction").InstagramParseSummary;
export type SimpleExtractedProfile = import("@/lib/types/instagramExtraction").ExtractedInstagramProfile;

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
