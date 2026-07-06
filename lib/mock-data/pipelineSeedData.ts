import { mockPipelineStore } from "@/lib/mock-data/pipelineStore";
import type {
  PipelineJobDocument,
  PipelineProvider,
  PipelineStageProgress,
} from "@/lib/types/pipeline";
import { PIPELINE_STAGES } from "@/lib/types/pipeline";

const HOURS = 60 * 60 * 1000;
const now = Date.now();

function buildStageProgress(
  completedStages: number,
  runningStage: number | null,
  records: number,
  errors: number,
): PipelineStageProgress[] {
  return PIPELINE_STAGES.map((stage, index) => {
    if (index < completedStages) {
      return {
        stage,
        status: "completed",
        startedAt: new Date(now - (8 - index) * HOURS).toISOString(),
        completedAt: new Date(now - (7 - index) * HOURS).toISOString(),
        durationMs: 45 * 60 * 1000,
        recordCount: records,
        errorCount: index === completedStages - 1 ? errors : 0,
      };
    }
    if (runningStage === index) {
      return {
        stage,
        status: "running",
        startedAt: new Date(now - 0.5 * HOURS).toISOString(),
        completedAt: null,
        durationMs: null,
        recordCount: Math.floor(records * 0.6),
        errorCount: errors,
      };
    }
    return {
      stage,
      status: "pending",
      startedAt: null,
      completedAt: null,
      durationMs: null,
      recordCount: 0,
      errorCount: 0,
    };
  });
}

interface SeedJob {
  provider: PipelineProvider;
  status: PipelineJobDocument["status"];
  currentStage: PipelineJobDocument["currentStage"];
  progress: number;
  totalRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  createdAt: string;
  completedAt: string | null;
  completedStages: number;
  runningStage: number | null;
  importJobId: string;
}

const SEED_JOBS: SeedJob[] = [
  {
    provider: "instagram",
    status: "extracting",
    currentStage: "extraction",
    progress: 42,
    totalRecords: 1000,
    processedRecords: 420,
    successfulRecords: 400,
    failedRecords: 20,
    createdAt: new Date(now - 4 * HOURS).toISOString(),
    completedAt: null,
    completedStages: 2,
    runningStage: 2,
    importJobId: "seed_import_1",
  },
  {
    provider: "google_places",
    status: "queued",
    currentStage: "queue",
    progress: 14,
    totalRecords: 250,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    createdAt: new Date(now - 1 * HOURS).toISOString(),
    completedAt: null,
    completedStages: 1,
    runningStage: 1,
    importJobId: "seed_places_1",
  },
  {
    provider: "website",
    status: "review",
    currentStage: "review",
    progress: 78,
    totalRecords: 120,
    processedRecords: 120,
    successfulRecords: 115,
    failedRecords: 5,
    createdAt: new Date(now - 12 * HOURS).toISOString(),
    completedAt: null,
    completedStages: 5,
    runningStage: 5,
    importJobId: "seed_website_1",
  },
  {
    provider: "csv",
    status: "ready_to_publish",
    currentStage: "publish",
    progress: 92,
    totalRecords: 500,
    processedRecords: 480,
    successfulRecords: 470,
    failedRecords: 10,
    createdAt: new Date(now - 20 * HOURS).toISOString(),
    completedAt: null,
    completedStages: 6,
    runningStage: 6,
    importJobId: "seed_csv_1",
  },
  {
    provider: "instagram",
    status: "published",
    currentStage: "publish",
    progress: 100,
    totalRecords: 320,
    processedRecords: 320,
    successfulRecords: 310,
    failedRecords: 10,
    createdAt: new Date(now - 48 * HOURS).toISOString(),
    completedAt: new Date(now - 40 * HOURS).toISOString(),
    completedStages: 7,
    runningStage: null,
    importJobId: "seed_import_3",
  },
  {
    provider: "csv",
    status: "failed",
    currentStage: "normalization",
    progress: 35,
    totalRecords: 80,
    processedRecords: 28,
    successfulRecords: 20,
    failedRecords: 8,
    createdAt: new Date(now - 6 * HOURS).toISOString(),
    completedAt: new Date(now - 5 * HOURS).toISOString(),
    completedStages: 3,
    runningStage: null,
    importJobId: "seed_csv_fail",
  },
];

const STAGE_MESSAGES = [
  "Import job created.",
  "Records queued for worker processing.",
  "Metadata extraction in progress.",
  "Entity normalization completed.",
  "Duplicate detection completed.",
  "Records sent to review queue.",
  "Approved records placed in publish queue.",
];

export function seedPipelineMockDataIfEmpty(): void {
  if (mockPipelineStore.hasJobs()) return;

  for (const seed of SEED_JOBS) {
    const job = mockPipelineStore.createJob({
      provider: seed.provider,
      status: seed.status,
      currentStage: seed.currentStage,
      progress: seed.progress,
      totalRecords: seed.totalRecords,
      processedRecords: seed.processedRecords,
      successfulRecords: seed.successfulRecords,
      failedRecords: seed.failedRecords,
      createdBy: "system-dev",
      createdAt: seed.createdAt,
      updatedAt: new Date().toISOString(),
      completedAt: seed.completedAt,
      importJobId: seed.importJobId,
      extractionJobId: null,
      sourceJobId: seed.importJobId,
      stageProgress: buildStageProgress(
        seed.completedStages,
        seed.runningStage,
        seed.processedRecords,
        seed.failedRecords,
      ),
      metadata: { seed: true },
    });

    for (let index = 0; index <= seed.completedStages; index += 1) {
      const stage = PIPELINE_STAGES[index];
      if (!stage) continue;
      mockPipelineStore.createEvent({
        jobId: job.id,
        recordId: null,
        stage,
        status: seed.status,
        message: STAGE_MESSAGES[index] ?? "Pipeline event.",
        duration: index < seed.completedStages ? 120000 : null,
        worker: index === 2 ? "worker_mac_studio" : null,
        timestamp: new Date(
          new Date(seed.createdAt).getTime() + index * 30 * 60 * 1000,
        ).toISOString(),
      });
    }
  }

  mockPipelineStore.createPublishEntry({
    importRecordId: "seed_record_pub_1",
    approvedRecordId: "seed_approved_1",
    pipelineJobId: mockPipelineStore.listJobs().find((j) => j.status === "ready_to_publish")?.id ?? null,
    provider: "csv",
    status: "pending",
    displayName: "BMW Club München",
    importSource: "csv",
    createdAt: new Date(now - 2 * HOURS).toISOString(),
    publishedAt: null,
    metadata: { seed: true },
  });
}
