import { mockWorkerStore } from "@/lib/mock-data/workerStore";
import { RUNTIME_CONFIG } from "@/lib/config/runtime";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  listWorkers as fetchWorkers,
  updateWorker as persistUpdateWorker,
  upsertWorkerById,
} from "@/lib/repositories/workersRepository";
import { createWorkerLog as persistWorkerLog } from "@/lib/repositories/workerLogsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type { CreateWorkerLogInput, WorkerDocument, WorkerStatus } from "@/lib/types/workers";
import { isHeartbeatExpired } from "@/workers/runtime/heartbeat";
import {
  buildWorkerRegistrationInput,
  type WorkerRegistrationResult,
} from "@/workers/runtime/workerRegistration";

async function saveWorkerLog(input: CreateWorkerLogInput): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistWorkerLog(input);
      return;
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
    }
  }
  mockWorkerStore.createWorkerLog(input);
}

async function loadWorkers(): Promise<WorkerDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchWorkers();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockWorkerStore.listWorkers();
      }
      throw error;
    }
  }
  return mockWorkerStore.listWorkers();
}

export async function registerWorkerInstance(
  workerId: string,
): Promise<WorkerRegistrationResult> {
  const timestamp = new Date().toISOString();
  const input = buildWorkerRegistrationInput(workerId);

  let worker: WorkerDocument;
  let isNew = true;

  if (isFirestoreAvailable()) {
    try {
      worker = await upsertWorkerById(workerId, input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        worker = mockWorkerStore.registerWorker(input, workerId);
      } else {
        throw error;
      }
    }
  } else {
    const existing = mockWorkerStore.getWorker(workerId);
    if (existing) {
      worker = mockWorkerStore.updateWorker(workerId, {
        ...input,
        jobsCompleted: existing.jobsCompleted,
        startedAt: existing.startedAt,
      })!;
      isNew = false;
    } else {
      worker = mockWorkerStore.registerWorker(input, workerId);
    }
  }

  await saveWorkerLog({
    timestamp,
    workerId: worker.id,
    workerName: worker.name,
    level: "info",
    event: "Worker Started",
    jobId: null,
    message: `Worker registered on ${worker.hostname} (${worker.platform})`,
  });

  return { worker, isNew };
}

export async function sendHeartbeat(
  workerId: string,
  update: {
    status?: WorkerStatus;
    currentJob?: string | null;
    jobsRunning?: number;
    jobsCompleted?: number;
    cpuUsagePercent?: number | null;
    memoryUsagePercent?: number | null;
  } = {},
): Promise<WorkerDocument | null> {
  const timestamp = new Date().toISOString();
  const payload = {
    lastHeartbeat: timestamp,
    ...update,
  };

  if (isFirestoreAvailable()) {
    try {
      await persistUpdateWorker(workerId, payload);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockWorkerStore.updateWorker(workerId, payload);
      } else {
        throw error;
      }
    }
  } else {
    mockWorkerStore.updateWorker(workerId, payload);
  }

  await saveWorkerLog({
    timestamp,
    workerId,
    workerName: RUNTIME_CONFIG.workerName,
    level: "debug",
    event: "Heartbeat",
    jobId: update.currentJob ?? null,
    message: update.currentJob
      ? `Processing job ${update.currentJob}`
      : "Worker idle — awaiting queued jobs",
  });

  if (isFirestoreAvailable()) {
    try {
      return (await fetchWorkers()).find((worker) => worker.id === workerId) ?? null;
    } catch {
      return mockWorkerStore.getWorker(workerId);
    }
  }

  return mockWorkerStore.getWorker(workerId);
}

export async function markWorkerOffline(workerId: string): Promise<void> {
  const timestamp = new Date().toISOString();

  const payload = {
    status: "offline" as const,
    currentJob: null,
    jobsRunning: 0,
    lastHeartbeat: timestamp,
  };

  if (isFirestoreAvailable()) {
    try {
      await persistUpdateWorker(workerId, payload);
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
    }
  }
  mockWorkerStore.updateWorker(workerId, payload);

  await saveWorkerLog({
    timestamp,
    workerId,
    workerName: RUNTIME_CONFIG.workerName,
    level: "warning",
    event: "Worker Shutdown",
    jobId: null,
    message: "Worker shut down gracefully",
  });
}

export async function listLiveWorkers(): Promise<WorkerDocument[]> {
  const workers = await loadWorkers();
  return workers.map((worker) => ({
    ...worker,
    status: isHeartbeatExpired(worker.lastHeartbeat) ? ("offline" as const) : worker.status,
  }));
}

export { isHeartbeatExpired };
