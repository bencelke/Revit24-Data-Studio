export const EXTRACTION_QUEUE_STATUSES = [
  "pending",
  "running",
  "success",
  "failed",
  "skipped",
] as const;

import type { InstagramEntityType } from "@/lib/types/instagramExtraction";

export type ExtractionQueueStatus = (typeof EXTRACTION_QUEUE_STATUSES)[number];

export interface InstagramExtractionQueueDocument {
  id: string;
  username: string;
  profileUrl: string;
  status: ExtractionQueueStatus;
  createdAt: string;
  updatedAt: string;
  startedAt: string | null;
  completedAt: string | null;
  attempts: number;
  errorCode: string | null;
  errorMessage: string | null;
}

export type CreateInstagramExtractionQueueInput = Omit<InstagramExtractionQueueDocument, "id">;

export interface InstagramQueueJobSummary {
  queued: number;
  skipped: number;
  storageMode: "live" | "mock";
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
