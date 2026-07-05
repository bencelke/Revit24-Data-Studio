import type { CreateWorkerInput, WorkerDocument } from "@/lib/types/workers";

const mockWorkers = new Map<string, WorkerDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

const SEED_WORKERS: WorkerDocument[] = [
  {
    id: "worker_mac_studio",
    name: "Mac Studio — Primary",
    hostname: "mac-studio.local",
    machineName: "Mac Studio M2 Ultra",
    version: "0.1.0-mvp",
    status: "busy",
    machine: "Mac Studio M2 Ultra",
    platform: "macOS",
    environment: "development",
    startedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
    lastHeartbeat: new Date(Date.now() - 15_000).toISOString(),
    currentJob: "ext_job_running",
    jobsCompleted: 142,
    jobsRunning: 1,
    cpuUsagePercent: 42,
    memoryUsagePercent: 58,
  },
  {
    id: "worker_macbook",
    name: "MacBook Pro — Dev",
    hostname: "macbook-pro.local",
    machineName: "MacBook Pro M3 Pro",
    version: "0.1.0-mvp",
    status: "idle",
    machine: "MacBook Pro M3 Pro",
    platform: "macOS",
    environment: "development",
    startedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    lastHeartbeat: new Date(Date.now() - 25_000).toISOString(),
    currentJob: null,
    jobsCompleted: 38,
    jobsRunning: 0,
    cpuUsagePercent: 12,
    memoryUsagePercent: 34,
  },
  {
    id: "worker_ubuntu",
    name: "Ubuntu VPS — Production",
    hostname: "revit24-worker-01",
    machineName: "Hetzner CX42",
    version: "0.1.0-mvp",
    status: "online",
    machine: "Hetzner CX42",
    platform: "Ubuntu 24.04",
    environment: "production",
    startedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    lastHeartbeat: new Date(Date.now() - 10_000).toISOString(),
    currentJob: null,
    jobsCompleted: 891,
    jobsRunning: 0,
    cpuUsagePercent: 28,
    memoryUsagePercent: 45,
  },
  {
    id: "worker_windows",
    name: "Windows Desktop — Legacy",
    hostname: "win-desktop",
    machineName: "Custom PC",
    version: "0.1.0-mvp",
    status: "offline",
    machine: "Custom PC",
    platform: "Windows 11",
    environment: "development",
    startedAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(),
    lastHeartbeat: new Date(Date.now() - 3_600_000).toISOString(),
    currentJob: null,
    jobsCompleted: 12,
    jobsRunning: 0,
    cpuUsagePercent: null,
    memoryUsagePercent: null,
  },
];

function seedWorkersIfEmpty(): void {
  if (mockWorkers.size > 0) return;
  for (const worker of SEED_WORKERS) {
    mockWorkers.set(worker.id, worker);
  }
}

export const mockWorkerStore = {
  listWorkers(): WorkerDocument[] {
    seedWorkersIfEmpty();
    return [...mockWorkers.values()].sort(
      (a, b) => new Date(b.lastHeartbeat).getTime() - new Date(a.lastHeartbeat).getTime(),
    );
  },

  getWorker(id: string): WorkerDocument | null {
    seedWorkersIfEmpty();
    return mockWorkers.get(id) ?? null;
  },

  registerWorker(input: CreateWorkerInput, id?: string): WorkerDocument {
    const workerId = id ?? generateId("worker");
    const worker: WorkerDocument = { ...input, id: workerId };
    mockWorkers.set(workerId, worker);
    return worker;
  },

  updateWorker(id: string, data: Partial<CreateWorkerInput>): WorkerDocument | null {
    seedWorkersIfEmpty();
    const existing = mockWorkers.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockWorkers.set(id, updated);
    return updated;
  },

  createWorkerLog(input: import("@/lib/types/workers").CreateWorkerLogInput) {
    const id = generateId("wlog");
    const log = { ...input, id };
    mockLogs.set(id, log);
    return log;
  },

  listWorkerLogs() {
    return [...mockLogs.values()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },

  hasLogs(): boolean {
    return mockLogs.size > 0;
  },
};

const mockLogs = new Map<string, import("@/lib/types/workers").WorkerLogDocument>();
