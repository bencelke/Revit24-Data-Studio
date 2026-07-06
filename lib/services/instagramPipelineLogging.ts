import { logStageTransition } from "@/lib/services/pipelineEventService";
import { listPipelineJobs } from "@/lib/services/pipelineService";

export async function logInstagramExtractionPipelineEvent(input: {
  importJobId: string | null | undefined;
  recordId?: string | null;
  message: string;
  status?: "extracting" | "extracted" | "failed";
}): Promise<void> {
  if (!input.importJobId) return;

  try {
    const jobs = await listPipelineJobs();
    const pipelineJob = jobs.find((job) => job.importJobId === input.importJobId);
    if (!pipelineJob) return;

    await logStageTransition({
      jobId: pipelineJob.id,
      recordId: input.recordId ?? null,
      stage: "extraction",
      status: input.status === "failed" ? "failed" : "extracting",
      message: input.message,
    });
  } catch {
    // Pipeline logging is best-effort
  }
}
