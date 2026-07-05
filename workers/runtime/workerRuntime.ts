import { RUNTIME_CONFIG } from "@/lib/config/runtime";
import { claimNextQueuedJob } from "@/lib/services/jobClaimService";
import {
  markWorkerOffline,
  registerWorkerInstance,
  sendHeartbeat,
} from "@/lib/services/heartbeatService";
import { executeExtractionJob } from "@/workers/runtime/jobExecutor";
import { createHeartbeatController } from "@/workers/runtime/heartbeat";
import { createShutdownHandler } from "@/workers/runtime/shutdownHandler";
import {
  generateWorkerId,
  type WorkerRegistrationResult,
} from "@/workers/runtime/workerRegistration";
import type { ExtractionJobDocument } from "@/lib/types/queue";

export interface WorkerRuntimeState {
  workerId: string;
  isRunning: boolean;
  currentJobId: string | null;
}

export interface WorkerRuntimeCycleResult {
  claimed: boolean;
  job: ExtractionJobDocument | null;
  processed: number;
  successful: number;
  failed: number;
}

let runtimeState: WorkerRuntimeState = {
  workerId: "",
  isRunning: false,
  currentJobId: null,
};

let stopRequested = false;

export function getWorkerRuntimeState(): WorkerRuntimeState {
  return { ...runtimeState };
}

export function requestWorkerStop(): void {
  stopRequested = true;
}

export async function initializeWorkerRuntime(
  workerId = process.env.WORKER_ID ?? generateWorkerId(),
): Promise<WorkerRegistrationResult> {
  const registration = await registerWorkerInstance(workerId);
  runtimeState = {
    workerId: registration.worker.id,
    isRunning: false,
    currentJobId: null,
  };
  stopRequested = false;
  return registration;
}

export async function runWorkerRuntimeCycle(): Promise<WorkerRuntimeCycleResult> {
  if (!runtimeState.workerId) {
    await initializeWorkerRuntime();
  }

  await sendHeartbeat(runtimeState.workerId, {
    status: "idle",
    currentJob: null,
    jobsRunning: 0,
    cpuUsagePercent: null,
    memoryUsagePercent: null,
  });

  if (stopRequested) {
    return { claimed: false, job: null, processed: 0, successful: 0, failed: 0 };
  }

  const job = await claimNextQueuedJob(runtimeState.workerId);
  if (!job) {
    return { claimed: false, job: null, processed: 0, successful: 0, failed: 0 };
  }

  runtimeState.isRunning = true;
  runtimeState.currentJobId = job.id;

  await sendHeartbeat(runtimeState.workerId, {
    status: "busy",
    currentJob: job.id,
    jobsRunning: 1,
  });

  const result = await executeExtractionJob(job, {
    workerId: runtimeState.workerId,
    workerName: RUNTIME_CONFIG.workerName,
    shouldStop: () => stopRequested,
  });

  const currentWorker = await sendHeartbeat(runtimeState.workerId, {
    status: "idle",
    currentJob: null,
    jobsRunning: 0,
  });

  if (currentWorker) {
    await sendHeartbeat(runtimeState.workerId, {
      jobsCompleted: currentWorker.jobsCompleted + 1,
    });
  }

  runtimeState.isRunning = false;
  runtimeState.currentJobId = null;

  return {
    claimed: true,
    job,
    processed: result.processed,
    successful: result.successful,
    failed: result.failed,
  };
}

export async function shutdownWorkerRuntime(): Promise<void> {
  stopRequested = true;
  if (runtimeState.workerId) {
    await markWorkerOffline(runtimeState.workerId);
  }
  runtimeState.isRunning = false;
  runtimeState.currentJobId = null;
}

export async function startWorkerRuntimeLoop(): Promise<void> {
  await initializeWorkerRuntime();

  const heartbeat = createHeartbeatController();
  const shutdown = createShutdownHandler();

  shutdown.register(async () => {
    heartbeat.stop();
    await shutdownWorkerRuntime();
  });

  heartbeat.start(async () => {
    await sendHeartbeat(runtimeState.workerId, {
      status: runtimeState.currentJobId ? "busy" : "idle",
      currentJob: runtimeState.currentJobId,
      jobsRunning: runtimeState.currentJobId ? 1 : 0,
      cpuUsagePercent: Math.floor(Math.random() * 30) + 10,
      memoryUsagePercent: Math.floor(Math.random() * 40) + 20,
    });
  });

  while (!stopRequested) {
    await runWorkerRuntimeCycle();
    await sleep(RUNTIME_CONFIG.pollingIntervalMs);
  }

  heartbeat.stop();
  await shutdownWorkerRuntime();
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
