export const EXTRACTION_JOB_STATUSES = [
  "waiting",
  "queued",
  "running",
  "paused",
  "completed",
  "failed",
  "cancelled",
  "retrying",
] as const;

export const EXTRACTION_RECORD_STATUSES = [
  "waiting",
  "queued",
  "running",
  "completed",
  "failed",
  "cancelled",
  "retrying",
] as const;

export const EXTRACTION_PRIORITIES = ["low", "normal", "high", "critical"] as const;

export const EXTRACTION_PLATFORMS = [
  "instagram",
  "google_places",
  "website",
  "tiktok",
  "youtube",
] as const;

export type ExtractionJobStatus = (typeof EXTRACTION_JOB_STATUSES)[number];
export type ExtractionRecordStatus = (typeof EXTRACTION_RECORD_STATUSES)[number];
export type ExtractionPriority = (typeof EXTRACTION_PRIORITIES)[number];
export type ExtractionPlatform = (typeof EXTRACTION_PLATFORMS)[number];
export type QueueDataMode = "firestore" | "mock";

export interface ExtractionJobDocument {
  id: string;
  importJobId: string;
  name: string;
  platform: ExtractionPlatform;
  status: ExtractionJobStatus;
  priority: ExtractionPriority;
  createdBy: string;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  duplicateRecords: number;
  workerVersion: string | null;
  notes: string | null;
}

export interface ExtractionRecordDocument {
  id: string;
  jobId: string;
  importRecordId: string;
  username: string | null;
  profileUrl: string | null;
  status: ExtractionRecordStatus;
  attempts: number;
  startedAt: string | null;
  completedAt: string | null;
  lastError: string | null;
  workerId: string | null;
}

export type CreateExtractionJobInput = Omit<ExtractionJobDocument, "id">;
export type CreateExtractionRecordInput = Omit<ExtractionRecordDocument, "id">;

export interface ExtractionJobWithRecords extends ExtractionJobDocument {
  records: ExtractionRecordDocument[];
}

export interface QueueDashboardStats {
  waiting: number;
  queued: number;
  running: number;
  completedToday: number;
  failed: number;
  paused: number;
  retrying: number;
}

export interface QueueJobView extends ExtractionJobDocument {
  importJobName: string;
  progressPercent: number;
  durationMs: number | null;
}

export interface QueueTimelineEvent {
  id: string;
  timestamp: string;
  status: ExtractionJobStatus;
  message: string;
  actor: string;
}

export type QueueSortField =
  | "name"
  | "platform"
  | "status"
  | "priority"
  | "estimatedRecords"
  | "processedRecords"
  | "progressPercent"
  | "createdAt"
  | "durationMs";

export type QueueSortDirection = "asc" | "desc";

export interface QueueFilterParams {
  search?: string;
  status?: ExtractionJobStatus | "all";
  platform?: ExtractionPlatform | "all";
  priority?: ExtractionPriority | "all";
  sortField?: QueueSortField;
  sortDirection?: QueueSortDirection;
  page?: number;
  pageSize?: number;
}

export interface QueueListResult {
  jobs: QueueJobView[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface QueueDashboardData {
  stats: QueueDashboardStats;
  jobs: QueueJobView[];
  dataMode: QueueDataMode;
  firebaseConfigured: boolean;
  warning?: string;
}

export interface QueueJobDetailData {
  job: QueueJobView;
  records: ExtractionRecordDocument[];
  timeline: QueueTimelineEvent[];
  dataMode: QueueDataMode;
  firebaseConfigured: boolean;
}

export type QueueAction =
  | "queue"
  | "pause"
  | "resume"
  | "cancel"
  | "retry"
  | "set_priority"
  | "reorder";

export interface QueueActionPayload {
  action: QueueAction;
  priority?: ExtractionPriority;
  order?: number;
}

export function calculateProgress(processed: number, estimated: number): number {
  if (estimated <= 0) return 0;
  return Math.min(100, Math.round((processed / estimated) * 100));
}

export function calculateDurationMs(
  startedAt: string | null,
  completedAt: string | null,
  now = Date.now(),
): number | null {
  if (!startedAt) return null;
  const end = completedAt ? new Date(completedAt).getTime() : now;
  return Math.max(0, end - new Date(startedAt).getTime());
}

export function formatDuration(ms: number | null): string {
  if (ms == null) return "—";
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ${minutes % 60}m`;
}
