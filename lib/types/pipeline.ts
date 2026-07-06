export const PIPELINE_PROVIDERS = [
  "instagram",
  "google_places",
  "website",
  "csv",
  "api",
  "manual",
] as const;

export type PipelineProvider = (typeof PIPELINE_PROVIDERS)[number];

export const PIPELINE_STATUSES = [
  "created",
  "queued",
  "extracting",
  "extracted",
  "normalizing",
  "normalized",
  "matching",
  "review",
  "approved",
  "rejected",
  "ready_to_publish",
  "published",
  "failed",
] as const;

export type PipelineStatus = (typeof PIPELINE_STATUSES)[number];

export const PIPELINE_STAGES = [
  "import",
  "queue",
  "extraction",
  "normalization",
  "duplicate_detection",
  "review",
  "publish",
] as const;

export type PipelineStage = (typeof PIPELINE_STAGES)[number];

export const PUBLISH_QUEUE_STATUSES = [
  "pending",
  "ready",
  "published",
  "failed",
] as const;

export type PublishQueueStatus = (typeof PUBLISH_QUEUE_STATUSES)[number];

export interface PipelineStageProgress {
  stage: PipelineStage;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startedAt: string | null;
  completedAt: string | null;
  durationMs: number | null;
  recordCount: number;
  errorCount: number;
}

export interface PipelineJobDocument {
  id: string;
  provider: PipelineProvider;
  status: PipelineStatus;
  currentStage: PipelineStage;
  progress: number;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
  importJobId: string | null;
  extractionJobId: string | null;
  sourceJobId: string | null;
  stageProgress: PipelineStageProgress[];
  metadata: Record<string, unknown> | null;
}

export type CreatePipelineJobInput = Omit<PipelineJobDocument, "id">;

export interface PipelineEventDocument {
  id: string;
  jobId: string;
  recordId: string | null;
  stage: PipelineStage;
  status: PipelineStatus;
  message: string;
  duration: number | null;
  worker: string | null;
  timestamp: string;
}

export type CreatePipelineEventInput = Omit<PipelineEventDocument, "id">;

export interface PublishQueueDocument {
  id: string;
  importRecordId: string;
  approvedRecordId: string | null;
  pipelineJobId: string | null;
  provider: PipelineProvider;
  status: PublishQueueStatus;
  displayName: string | null;
  importSource: string;
  createdAt: string;
  publishedAt: string | null;
  metadata: Record<string, unknown> | null;
}

export type CreatePublishQueueInput = Omit<PublishQueueDocument, "id">;

export interface UnifiedPipelineDashboardStats {
  runningPipelines: number;
  queued: number;
  reviewWaiting: number;
  readyToPublish: number;
  published: number;
  failed: number;
}

export interface PipelineMetrics {
  runningJobs: number;
  averageDurationMs: number;
  failureRate: number;
  successRate: number;
  recordsPerHour: number;
  mostActiveProvider: PipelineProvider | null;
}

export interface PipelineDashboardData {
  stats: UnifiedPipelineDashboardStats;
  metrics: PipelineMetrics;
  recentJobs: PipelineJobDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  warning?: string;
}

export interface PipelineJobDetailData {
  job: PipelineJobDocument;
  events: PipelineEventDocument[];
  estimatedRemainingMs: number | null;
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
}

export interface PipelineListResult {
  jobs: PipelineJobDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
