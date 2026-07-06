import { mockPipelineStore } from "@/lib/mock-data/pipelineStore";
import { seedPipelineMockDataIfEmpty } from "@/lib/mock-data/pipelineSeedData";
import type {
  PipelineProvider,
  PipelineStage,
  PipelineStageProgress,
  PipelineStatus,
} from "@/lib/types/pipeline";
import { PIPELINE_STAGES } from "@/lib/types/pipeline";

export const STAGE_TO_STATUS: Record<PipelineStage, PipelineStatus> = {
  import: "created",
  queue: "queued",
  extraction: "extracting",
  normalization: "normalizing",
  duplicate_detection: "matching",
  review: "review",
  publish: "ready_to_publish",
};

export const STATUS_TO_STAGE: Partial<Record<PipelineStatus, PipelineStage>> = {
  created: "import",
  queued: "queue",
  extracting: "extraction",
  extracted: "extraction",
  normalizing: "normalization",
  normalized: "normalization",
  matching: "duplicate_detection",
  review: "review",
  approved: "review",
  rejected: "review",
  ready_to_publish: "publish",
  published: "publish",
  failed: "import",
};

export function createInitialStageProgress(): PipelineStageProgress[] {
  return PIPELINE_STAGES.map((stage) => ({
    stage,
    status: "pending",
    startedAt: null,
    completedAt: null,
    durationMs: null,
    recordCount: 0,
    errorCount: 0,
  }));
}

export function computePipelineProgress(
  processedRecords: number,
  totalRecords: number,
  stageIndex: number,
): number {
  if (totalRecords <= 0) {
    return Math.round(((stageIndex + 1) / PIPELINE_STAGES.length) * 100);
  }
  const stageWeight = 100 / PIPELINE_STAGES.length;
  const recordRatio = Math.min(processedRecords / totalRecords, 1);
  return Math.min(100, Math.round(stageIndex * stageWeight + recordRatio * stageWeight));
}

export function getStageIndex(stage: PipelineStage): number {
  return PIPELINE_STAGES.indexOf(stage);
}

export function getNextStage(stage: PipelineStage): PipelineStage | null {
  const index = getStageIndex(stage);
  if (index < 0 || index >= PIPELINE_STAGES.length - 1) return null;
  return PIPELINE_STAGES[index + 1] ?? null;
}

export function resolveStatusForStage(stage: PipelineStage): PipelineStatus {
  return STAGE_TO_STATUS[stage];
}

export function formatPipelineProvider(provider: PipelineProvider): string {
  switch (provider) {
    case "instagram":
      return "Instagram";
    case "google_places":
      return "Google Places";
    case "website":
      return "Website";
    case "csv":
      return "CSV Import";
    case "api":
      return "API";
    case "manual":
      return "Manual";
    default:
      return provider;
  }
}

export function formatPipelineStatus(status: PipelineStatus): string {
  return status
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatPipelineStage(stage: PipelineStage): string {
  switch (stage) {
    case "import":
      return "Import";
    case "queue":
      return "Queue";
    case "extraction":
      return "Extraction";
    case "normalization":
      return "Normalization";
    case "duplicate_detection":
      return "Duplicate Detection";
    case "review":
      return "Review";
    case "publish":
      return "Publish";
    default:
      return stage;
  }
}

export function isTerminalStatus(status: PipelineStatus): boolean {
  return status === "published" || status === "failed" || status === "rejected";
}

export function isRunningStatus(status: PipelineStatus): boolean {
  return [
    "queued",
    "extracting",
    "extracted",
    "normalizing",
    "normalized",
    "matching",
  ].includes(status);
}

export function updateStageProgress(
  stageProgress: PipelineStageProgress[],
  stage: PipelineStage,
  update: Partial<PipelineStageProgress>,
): PipelineStageProgress[] {
  return stageProgress.map((entry) =>
    entry.stage === stage ? { ...entry, ...update } : entry,
  );
}

export function estimateRemainingMs(
  startedAt: string,
  progress: number,
): number | null {
  if (progress <= 0 || progress >= 100) return null;
  const elapsed = Date.now() - new Date(startedAt).getTime();
  if (elapsed <= 0) return null;
  const totalEstimate = elapsed / (progress / 100);
  return Math.max(0, Math.round(totalEstimate - elapsed));
}

export function ensureMockPipelineSeeded(): void {
  seedPipelineMockDataIfEmpty();
}

export function getMockPipelineStore() {
  return mockPipelineStore;
}
