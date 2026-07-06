import type {
  PipelineJobDocument,
  PipelineMetrics,
  PipelineProvider,
} from "@/lib/types/pipeline";

function average(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
}

function countByProvider(jobs: PipelineJobDocument[]): Map<PipelineProvider, number> {
  const counts = new Map<PipelineProvider, number>();
  for (const job of jobs) {
    counts.set(job.provider, (counts.get(job.provider) ?? 0) + 1);
  }
  return counts;
}

export function getPipelineMetrics(jobs: PipelineJobDocument[]): PipelineMetrics {
  const completedJobs = jobs.filter(
    (job) => job.completedAt != null && job.status !== "failed",
  );
  const failedJobs = jobs.filter((job) => job.status === "failed");
  const runningJobs = jobs.filter(
    (job) => !job.completedAt && job.status !== "failed" && job.status !== "published",
  );

  const durations = completedJobs
    .map((job) => {
      if (!job.completedAt) return null;
      return new Date(job.completedAt).getTime() - new Date(job.createdAt).getTime();
    })
    .filter((value): value is number => value != null && value > 0);

  const totalRecords = jobs.reduce((sum, job) => sum + job.processedRecords, 0);
  const oldestJob = jobs[jobs.length - 1];
  const hoursWindow = oldestJob
    ? Math.max(
        (Date.now() - new Date(oldestJob.createdAt).getTime()) / (60 * 60 * 1000),
        1,
      )
    : 1;

  const providerCounts = countByProvider(jobs);
  let mostActiveProvider: PipelineProvider | null = null;
  let maxCount = 0;
  for (const [provider, count] of providerCounts.entries()) {
    if (count > maxCount) {
      maxCount = count;
      mostActiveProvider = provider;
    }
  }

  const finishedCount = completedJobs.length + failedJobs.length;
  const successRate = finishedCount > 0 ? completedJobs.length / finishedCount : 0;
  const failureRate = finishedCount > 0 ? failedJobs.length / finishedCount : 0;

  return {
    runningJobs: runningJobs.length,
    averageDurationMs: Math.round(average(durations)),
    failureRate: Math.round(failureRate * 1000) / 10,
    successRate: Math.round(successRate * 1000) / 10,
    recordsPerHour: Math.round(totalRecords / hoursWindow),
    mostActiveProvider,
  };
}
