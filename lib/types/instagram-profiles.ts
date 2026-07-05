import type { ExtractionErrorCode } from "@/lib/types/profile-extraction";

export const INSTAGRAM_PROFILE_STATUSES = [
  "pending",
  "completed",
  "failed",
  "private",
  "not_found",
] as const;

export type InstagramProfileStatus = (typeof INSTAGRAM_PROFILE_STATUSES)[number];

export interface InstagramProfileDocument {
  id: string;
  username: string;
  displayName: string | null;
  bio: string | null;
  profileImageUrl: string | null;
  profileUrl: string;
  website: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  verified: boolean;
  businessCategory: string | null;
  extractedAt: string;
  extractionDurationMs: number;
  workerVersion: string;
  status: InstagramProfileStatus;
  errorCode: ExtractionErrorCode | null;
  errorMessage: string | null;
  extractionJobId: string | null;
  extractionRecordId: string | null;
  importRecordId: string | null;
  rawJson: Record<string, unknown> | null;
}

export type CreateInstagramProfileInput = Omit<InstagramProfileDocument, "id">;

export interface InstagramExtractionRunResult {
  username: string;
  profile: InstagramProfileDocument | null;
  success: boolean;
  error: string | null;
  durationMs: number;
}

export interface InstagramJobExtractionResult {
  jobId: string;
  processed: number;
  successful: number;
  failed: number;
  results: InstagramExtractionRunResult[];
  jobStatus: import("./queue").ExtractionJobStatus;
}

export interface QueueExtractionProgress {
  currentProfile: string | null;
  lastProcessedProfile: string | null;
  successful: number;
  failed: number;
  remaining: number;
  estimatedRemainingSeconds: number | null;
}
