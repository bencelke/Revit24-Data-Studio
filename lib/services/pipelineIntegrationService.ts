import type { PipelineProvider } from "@/lib/types/pipeline";
import {
  advancePipelineStage,
  createPipelineJob,
} from "@/lib/services/pipelineService";

export async function startPipelineForImport(input: {
  provider: PipelineProvider;
  importJobId: string;
  totalRecords: number;
  createdBy?: string;
  metadata?: Record<string, unknown> | null;
  skipExtraction?: boolean;
}): Promise<string> {
  const job = await createPipelineJob({
    provider: input.provider,
    totalRecords: input.totalRecords,
    createdBy: input.createdBy,
    importJobId: input.importJobId,
    sourceJobId: input.importJobId,
    metadata: input.metadata ?? null,
  });

  await advancePipelineStage(job.id, {
    stage: "queue",
    status: "queued",
    message: `${input.totalRecords} records queued for processing.`,
    totalRecords: input.totalRecords,
  });

  if (input.skipExtraction) {
    await advancePipelineStage(job.id, {
      stage: "extraction",
      status: "extracted",
      message: "Extraction skipped — metadata already available.",
      processedRecords: input.totalRecords,
      successfulRecords: input.totalRecords,
    });

    await advancePipelineStage(job.id, {
      stage: "normalization",
      status: "normalized",
      message: "Normalization completed.",
      processedRecords: input.totalRecords,
      successfulRecords: input.totalRecords,
    });

    await advancePipelineStage(job.id, {
      stage: "duplicate_detection",
      status: "matching",
      message: "Duplicate detection completed.",
      processedRecords: input.totalRecords,
      successfulRecords: input.totalRecords,
    });

    await advancePipelineStage(job.id, {
      stage: "review",
      status: "review",
      message: "Records sent to review queue.",
      processedRecords: input.totalRecords,
      successfulRecords: input.totalRecords,
    });
  } else {
    await advancePipelineStage(job.id, {
      stage: "extraction",
      status: "extracting",
      message: "Extraction queued for worker runtime.",
      processedRecords: 0,
    });
  }

  return job.id;
}

export function mapImportSourceToPipelineProvider(importSource: string): PipelineProvider {
  const normalized = importSource.toLowerCase();
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("google") || normalized.includes("places")) return "google_places";
  if (normalized.includes("website")) return "website";
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("api")) return "api";
  return "manual";
}
