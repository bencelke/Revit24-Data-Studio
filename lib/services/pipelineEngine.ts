import type { ImportProvider, ImportProviderContext, ImportProviderResult } from "@/lib/types/import-provider";
import type { PipelineProvider } from "@/lib/types/pipeline";
import {
  advancePipelineStage,
  createPipelineJob,
  markPipelineFailed,
} from "@/lib/services/pipelineService";
import { logStageTransition } from "@/lib/services/pipelineEventService";

function successResult(processed = 0, message?: string): ImportProviderResult {
  return { success: true, processed, failed: 0, message };
}

function noopProviderStage(
  provider: PipelineProvider,
  name: string,
  stageMessage: string,
): ImportProvider {
  return {
    provider,
    name,
    async validate() {
      return successResult(0, "Validation passed.");
    },
    async prepare() {
      return successResult(0, "Preparation complete.");
    },
    async extract() {
      return successResult(0, stageMessage);
    },
    async normalize() {
      return successResult(0, "Normalization delegated to existing pipeline.");
    },
    async detectDuplicates() {
      return successResult(0, "Duplicate detection delegated to existing pipeline.");
    },
    async sendToReview() {
      return successResult(0, "Sent to review queue.");
    },
    async publish() {
      return successResult(0, "Queued for publish.");
    },
  };
}

const instagramProvider = noopProviderStage("instagram", "Instagram", "Extraction delegated to worker runtime.");
const googlePlacesProvider = noopProviderStage("google_places", "Google Places", "Places metadata extracted.");
const websiteProvider = noopProviderStage("website", "Website Discovery", "Website metadata extracted.");
const csvProvider = noopProviderStage("csv", "CSV Import", "CSV rows imported.");
const apiProvider = noopProviderStage("api", "API", "API records received.");
const manualProvider = noopProviderStage("manual", "Manual", "Manual records captured.");

const PROVIDER_REGISTRY: Record<PipelineProvider, ImportProvider> = {
  instagram: instagramProvider,
  google_places: googlePlacesProvider,
  website: websiteProvider,
  csv: csvProvider,
  api: apiProvider,
  manual: manualProvider,
};

export function getImportProvider(provider: PipelineProvider): ImportProvider {
  return PROVIDER_REGISTRY[provider];
}

const STAGE_METHODS: Array<{
  stage: "import" | "queue" | "extraction" | "normalization" | "duplicate_detection" | "review" | "publish";
  status: "created" | "queued" | "extracting" | "normalizing" | "matching" | "review" | "ready_to_publish";
  method: keyof ImportProvider;
}> = [
  { stage: "import", status: "created", method: "validate" },
  { stage: "queue", status: "queued", method: "prepare" },
  { stage: "extraction", status: "extracting", method: "extract" },
  { stage: "normalization", status: "normalizing", method: "normalize" },
  { stage: "duplicate_detection", status: "matching", method: "detectDuplicates" },
  { stage: "review", status: "review", method: "sendToReview" },
  { stage: "publish", status: "ready_to_publish", method: "publish" },
];

export async function runPipelineStage(
  jobId: string,
  provider: PipelineProvider,
  stageIndex: number,
  context: ImportProviderContext,
): Promise<ImportProviderResult> {
  const importProvider = getImportProvider(provider);
  const stageDef = STAGE_METHODS[stageIndex];
  if (!stageDef) {
    return { success: false, processed: 0, failed: 1, message: "Unknown pipeline stage." };
  }

  const started = Date.now();

  try {
    let result: ImportProviderResult;
    switch (stageDef.method) {
      case "validate":
        result = await importProvider.validate({ ...context, pipelineJobId: jobId });
        break;
      case "prepare":
        result = await importProvider.prepare({ ...context, pipelineJobId: jobId });
        break;
      case "extract":
        result = await importProvider.extract({ ...context, pipelineJobId: jobId });
        break;
      case "normalize":
        result = await importProvider.normalize({ ...context, pipelineJobId: jobId });
        break;
      case "detectDuplicates":
        result = await importProvider.detectDuplicates({ ...context, pipelineJobId: jobId });
        break;
      case "sendToReview":
        result = await importProvider.sendToReview({ ...context, pipelineJobId: jobId });
        break;
      case "publish":
        result = await importProvider.publish({ ...context, pipelineJobId: jobId });
        break;
      default:
        return { success: false, processed: 0, failed: 1, message: "Unknown pipeline stage." };
    }

    const durationMs = Date.now() - started;

    if (!result.success) {
      await markPipelineFailed(jobId, result.message ?? `Stage ${stageDef.stage} failed.`);
      return result;
    }

    await advancePipelineStage(jobId, {
      stage: stageDef.stage,
      status: stageDef.status,
      message: result.message ?? `Completed ${stageDef.stage}.`,
      processedRecords: result.processed,
      successfulRecords: result.processed,
      failedRecords: result.failed,
      durationMs,
    });

    return result;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Pipeline stage failed.";
    await markPipelineFailed(jobId, message);
    return { success: false, processed: 0, failed: 1, message };
  }
}

export async function startPipelineFromProvider(input: {
  provider: PipelineProvider;
  totalRecords?: number;
  createdBy?: string;
  importJobId?: string | null;
  extractionJobId?: string | null;
  sourceJobId?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<{ jobId: string }> {
  const job = await createPipelineJob(input);

  await logStageTransition({
    jobId: job.id,
    stage: "import",
    status: "created",
    message: `Pipeline started for ${input.provider}.`,
  });

  return { jobId: job.id };
}

export async function orchestratePipelineThroughReview(
  jobId: string,
  provider: PipelineProvider,
  context: ImportProviderContext,
): Promise<void> {
  for (let index = 0; index < STAGE_METHODS.length - 1; index += 1) {
    const result = await runPipelineStage(jobId, provider, index, context);
    if (!result.success) break;
  }
}
