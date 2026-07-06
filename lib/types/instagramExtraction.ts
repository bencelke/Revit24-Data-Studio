export const EXTRACTION_STATUSES = ["pending", "completed", "failed", "mock"] as const;

export type ExtractionStatus = (typeof EXTRACTION_STATUSES)[number];

export type ExtractorMode = "live" | "mock";

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

export interface ExtractedInstagramProfile {
  id: string;
  username: string;
  profileUrl: string;
  profileImageUrl: string | null;
  displayName: string | null;
  bio: string | null;
  publicEmail: string | null;
  website: string | null;
  status: ExtractionStatus;
  error: string | null;
  extractedAt: string | null;
}

export interface ExtractorPageData {
  extractorMode: ExtractorMode;
  extractionEnabled: boolean;
}

export interface ExtractorSettingsData {
  extractorMode: ExtractorMode;
  mockMode: boolean;
  extractionEnabled: boolean;
  extractionDelayMs: number;
  extractionMaxRetries: number;
}
