import { mockQueueStore } from "@/lib/mock-data/queueStore";
import { mockWorkerStore } from "@/lib/mock-data/workerStore";
import type { ExtractionJobStatus, ExtractionPlatform, ExtractionPriority } from "@/lib/types/queue";

const HOURS = 60 * 60 * 1000;
const now = Date.now();

interface SeedJob {
  importJobId: string;
  name: string;
  platform: ExtractionPlatform;
  status: ExtractionJobStatus;
  priority: ExtractionPriority;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  estimatedRecords: number;
  processedRecords: number;
  successfulRecords: number;
  failedRecords: number;
  duplicateRecords: number;
  workerVersion: string | null;
  claimedByWorkerId: string | null;
  claimedAt: string | null;
  notes: string | null;
}

const SEED_JOBS: SeedJob[] = [
  {
    importJobId: "seed_import_1",
    name: "Instagram Profiles — BMW Clubs DE",
    platform: "instagram",
    status: "running",
    priority: "high",
    createdAt: new Date(now - 4 * HOURS).toISOString(),
    startedAt: new Date(now - 3.5 * HOURS).toISOString(),
    completedAt: null,
    estimatedRecords: 1000,
    processedRecords: 250,
    successfulRecords: 230,
    failedRecords: 12,
    duplicateRecords: 8,
    workerVersion: "0.0.0-dev",
    claimedByWorkerId: "worker_mac_studio",
    claimedAt: new Date(now - 3.5 * HOURS).toISOString(),
    notes: "Primary extraction run for approved BMW club profiles",
  },
  {
    importJobId: "seed_import_2",
    name: "Instagram Profiles — Porsche Clubs EU",
    platform: "instagram" as const,
    status: "queued" as const,
    priority: "normal" as const,
    createdAt: new Date(now - 2 * HOURS).toISOString(),
    startedAt: null,
    completedAt: null,
    estimatedRecords: 480,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    duplicateRecords: 0,
    workerVersion: null,
    claimedByWorkerId: null,
    claimedAt: null,
    notes: null,
  },
  {
    importJobId: "seed_import_3",
    name: "Instagram Profiles — Audi Owners",
    platform: "instagram" as const,
    status: "completed" as const,
    priority: "normal" as const,
    createdAt: new Date(now - 26 * HOURS).toISOString(),
    startedAt: new Date(now - 25 * HOURS).toISOString(),
    completedAt: new Date(now - 22 * HOURS).toISOString(),
    estimatedRecords: 320,
    processedRecords: 320,
    successfulRecords: 298,
    failedRecords: 15,
    duplicateRecords: 7,
    workerVersion: "0.0.0-dev",
    claimedByWorkerId: "worker_ubuntu",
    claimedAt: new Date(now - 25 * HOURS).toISOString(),
    notes: "Completed overnight run",
  },
  {
    importJobId: "seed_import_4",
    name: "Instagram Profiles — VW Classic",
    platform: "instagram" as const,
    status: "failed" as const,
    priority: "low" as const,
    createdAt: new Date(now - 8 * HOURS).toISOString(),
    startedAt: new Date(now - 7.5 * HOURS).toISOString(),
    completedAt: new Date(now - 7 * HOURS).toISOString(),
    estimatedRecords: 150,
    processedRecords: 45,
    successfulRecords: 30,
    failedRecords: 15,
    duplicateRecords: 0,
    workerVersion: "0.0.0-dev",
    claimedByWorkerId: "worker_ubuntu",
    claimedAt: new Date(now - 7.5 * HOURS).toISOString(),
    notes: "Worker connection lost — retry scheduled",
  },
  {
    importJobId: "seed_import_5",
    name: "Instagram Profiles — Mercedes Clubs",
    platform: "instagram" as const,
    status: "paused" as const,
    priority: "critical" as const,
    createdAt: new Date(now - 1 * HOURS).toISOString(),
    startedAt: new Date(now - 0.75 * HOURS).toISOString(),
    completedAt: null,
    estimatedRecords: 720,
    processedRecords: 180,
    successfulRecords: 170,
    failedRecords: 5,
    duplicateRecords: 5,
    workerVersion: "0.0.0-dev",
    claimedByWorkerId: "worker_mac_studio",
    claimedAt: new Date(now - 0.75 * HOURS).toISOString(),
    notes: "Paused by admin for priority reorder",
  },
  {
    importJobId: "seed_import_6",
    name: "Instagram Profiles — Mini Cooper",
    platform: "instagram" as const,
    status: "waiting" as const,
    priority: "normal" as const,
    createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
    startedAt: null,
    completedAt: null,
    estimatedRecords: 95,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    duplicateRecords: 0,
    workerVersion: null,
    claimedByWorkerId: null,
    claimedAt: null,
    notes: null,
  },
  {
    importJobId: "seed_import_7",
    name: "Instagram Profiles — Opel Classic",
    platform: "instagram" as const,
    status: "retrying" as const,
    priority: "high" as const,
    createdAt: new Date(now - 12 * HOURS).toISOString(),
    startedAt: new Date(now - 11 * HOURS).toISOString(),
    completedAt: null,
    estimatedRecords: 200,
    processedRecords: 80,
    successfulRecords: 72,
    failedRecords: 8,
    duplicateRecords: 0,
    workerVersion: "0.0.0-dev",
    claimedByWorkerId: null,
    claimedAt: null,
    notes: "Automatic retry after transient failure",
  },
];

const SAMPLE_USERNAMES = [
  "bmwclubstuttgart",
  "porscheclubmunich",
  "audiownersberlin",
  "vwclassicfans",
  "mercedesbenzclub",
  "minicooper_de",
  "opelclassic",
  "alfaromeo_club",
];

export function seedQueueMockDataIfEmpty(): void {
  if (mockQueueStore.hasJobs()) return;

  for (const seed of SEED_JOBS) {
    const job = mockQueueStore.createExtractionJob({
      ...seed,
      createdBy: "system-dev",
    });

    const recordCount = Math.min(seed.processedRecords + 5, seed.estimatedRecords, 12);
    const records = Array.from({ length: recordCount }, (_, index) => {
      const username = SAMPLE_USERNAMES[index % SAMPLE_USERNAMES.length];
      const isProcessed = index < seed.processedRecords;
      const isFailed = isProcessed && index % 17 === 0;

      return {
        jobId: job.id,
        importRecordId: `seed_import_rec_${index}`,
        username,
        profileUrl: `https://instagram.com/${username}`,
        status: isProcessed
          ? isFailed
            ? ("failed" as const)
            : ("completed" as const)
          : seed.status === "running"
            ? index === seed.processedRecords
              ? ("running" as const)
              : ("queued" as const)
            : ("waiting" as const),
        attempts: isFailed ? 2 : isProcessed ? 1 : 0,
        startedAt: isProcessed ? seed.startedAt : null,
        completedAt: isProcessed && !isFailed ? seed.startedAt : null,
        lastError: isFailed ? "Connection timeout (mock)" : null,
        workerId: isProcessed ? "worker_mac_studio" : null,
      };
    });

    mockQueueStore.createExtractionRecords(records);

    mockQueueStore.addTimelineEvent(job.id, {
      timestamp: seed.createdAt,
      status: "waiting",
      message: "Extraction job created from approved import job",
      actor: "system-dev",
    });

    if (seed.startedAt) {
      mockQueueStore.addTimelineEvent(job.id, {
        timestamp: seed.startedAt,
        status: "running",
        message: "Worker picked up job",
        actor: "worker_mac_studio",
      });
    }

    if (seed.status === "paused") {
      mockQueueStore.addTimelineEvent(job.id, {
        timestamp: new Date(now - 0.5 * HOURS).toISOString(),
        status: "paused",
        message: "Job paused by admin",
        actor: "system-dev",
      });
    }

    if (seed.status === "failed") {
      mockQueueStore.addTimelineEvent(job.id, {
        timestamp: seed.completedAt ?? seed.createdAt,
        status: "failed",
        message: "Worker connection lost",
        actor: "worker_ubuntu",
      });
    }

    if (seed.status === "completed") {
      mockQueueStore.addTimelineEvent(job.id, {
        timestamp: seed.completedAt ?? seed.createdAt,
        status: "completed",
        message: "All records processed successfully",
        actor: "worker_ubuntu",
      });
    }
  }
}

export function seedWorkerLogsIfEmpty(): void {
  if (mockWorkerStore.hasLogs()) return;

  const logs = [
    {
      timestamp: new Date(now - 5 * 60 * 1000).toISOString(),
      workerId: "worker_mac_studio",
      workerName: "Mac Studio — Primary",
      level: "info" as const,
      event: "Record Processed",
      jobId: null,
      message: "Processed @bmwclubstuttgart (mock — no extraction performed)",
    },
    {
      timestamp: new Date(now - 12 * 60 * 1000).toISOString(),
      workerId: "worker_ubuntu",
      workerName: "Ubuntu VPS — Production",
      level: "warning" as const,
      event: "Retry Scheduled",
      jobId: null,
      message: "Record failed — scheduling retry attempt 2/3",
    },
    {
      timestamp: new Date(now - 25 * 60 * 1000).toISOString(),
      workerId: "worker_mac_studio",
      workerName: "Mac Studio — Primary",
      level: "info" as const,
      event: "Job Started",
      jobId: null,
      message: "Picked up extraction job: Instagram Profiles — BMW Clubs DE",
    },
    {
      timestamp: new Date(now - 45 * 60 * 1000).toISOString(),
      workerId: "worker_macbook",
      workerName: "MacBook Pro — Dev",
      level: "debug" as const,
      event: "Heartbeat",
      jobId: null,
      message: "Worker heartbeat — idle, awaiting assignment",
    },
    {
      timestamp: new Date(now - 2 * HOURS).toISOString(),
      workerId: "worker_ubuntu",
      workerName: "Ubuntu VPS — Production",
      level: "error" as const,
      event: "Job Failed",
      jobId: null,
      message: "Extraction job failed — worker connection lost (mock error)",
    },
    {
      timestamp: new Date(now - 3 * HOURS).toISOString(),
      workerId: "worker_windows",
      workerName: "Windows Desktop — Legacy",
      level: "warning" as const,
      event: "Worker Offline",
      jobId: null,
      message: "No heartbeat received for 60 minutes",
    },
  ];

  for (const log of logs) {
    mockWorkerStore.createWorkerLog(log);
  }
}
