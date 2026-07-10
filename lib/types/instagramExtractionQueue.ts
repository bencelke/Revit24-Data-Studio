import type { InstagramEntityType } from "@/lib/types/instagramExtraction";

export const EXTRACTION_QUEUE_STATUSES = [
  "queued",
  "pending",
  "running",
  "success",
  "failed",
  "skipped",
] as const;

export type ExtractionQueueStatus = (typeof EXTRACTION_QUEUE_STATUSES)[number];

export const INSTAGRAM_QUEUE_SOURCE = "revit24-data-studio" as const;
export const INSTAGRAM_QUEUE_PLATFORM = "instagram" as const;

export function buildInstagramQueueDocumentId(username: string): string {
  return `instagram-profile-${username.toLowerCase()}`;
}

export interface InstagramExtractionQueueDocument {
  id: string;
  source: typeof INSTAGRAM_QUEUE_SOURCE;
  sourcePlatform: typeof INSTAGRAM_QUEUE_PLATFORM;
  username: string;
  profileUrl: string;
  status: ExtractionQueueStatus;
  createdAt: string;
  updatedAt: string;
  startedAt: string;
  completedAt: string;
  attempts: number;
  errorCode: string;
  errorMessage: string;
}

export type CreateInstagramExtractionQueueInput = InstagramExtractionQueueDocument;

export interface InstagramQueueJobSummary {
  queued: number;
  skipped: number;
  storageMode: "firebase" | "mock";
}

export interface InstagramResultsSummary {
  pending: number;
  running: number;
  success: number;
  failed: number;
}

export interface InstagramResultsViewRow {
  id: string;
  rowType: "queue" | "extraction";
  queueId: string | null;
  extractionId: string | null;
  username: string;
  profileUrl: string;
  profileImageUrl: string | null;
  displayName: string | null;
  publicEmail: string | null;
  website: string | null;
  bio: string | null;
  entityType: InstagramEntityType;
  status: string;
  errorCode: string | null;
  errorMessage: string | null;
  extractedAt: string | null;
}

export interface InstagramResultsView {
  summary: InstagramResultsSummary;
  rows: InstagramResultsViewRow[];
}

export const ACTIVE_QUEUE_STATUSES: ExtractionQueueStatus[] = ["queued", "pending", "running"];

export function isActiveQueueStatus(status: ExtractionQueueStatus): boolean {
  return ACTIVE_QUEUE_STATUSES.includes(status);
}
