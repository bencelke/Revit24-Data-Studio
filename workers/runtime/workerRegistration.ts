import os from "node:os";
import { RUNTIME_CONFIG } from "@/lib/config/runtime";
import type { WorkerDocument } from "@/lib/types/workers";

export interface WorkerRegistrationResult {
  worker: WorkerDocument;
  isNew: boolean;
}

export function detectPlatform(): string {
  const platform = os.platform();
  switch (platform) {
    case "darwin":
      return "macOS";
    case "win32":
      return "Windows";
    case "linux":
      return "Linux";
    default:
      return platform;
  }
}

export function buildWorkerRegistrationInput(
  workerId: string,
  overrides: Partial<WorkerDocument> = {},
): Omit<WorkerDocument, "id"> {
  const timestamp = new Date().toISOString();
  const hostname = os.hostname();
  const machineName = os.type();

  return {
    name: RUNTIME_CONFIG.workerName,
    hostname,
    machineName,
    version: RUNTIME_CONFIG.workerVersion,
    status: "online",
    machine: machineName,
    platform: detectPlatform(),
    environment: RUNTIME_CONFIG.environment,
    startedAt: timestamp,
    lastHeartbeat: timestamp,
    currentJob: null,
    jobsCompleted: 0,
    jobsRunning: 0,
    cpuUsagePercent: null,
    memoryUsagePercent: null,
    ...overrides,
  };
}

export function generateWorkerId(): string {
  const hostname = os.hostname().replace(/[^a-zA-Z0-9-]/g, "-").toLowerCase();
  return `worker_${hostname}_${Date.now().toString(36)}`;
}
