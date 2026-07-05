import type { CreateWorkerLogInput, WorkerDocument, WorkerLogDocument } from "@/lib/types/workers";

const mockWorkers: WorkerDocument[] = [
  {
    id: "worker_mac_studio",
    name: "Mac Studio — Primary",
    version: "0.0.0-dev",
    status: "busy",
    machine: "Mac Studio M2 Ultra",
    platform: "macOS",
    lastHeartbeat: new Date(Date.now() - 30_000).toISOString(),
    jobsCompleted: 142,
    jobsRunning: 1,
  },
  {
    id: "worker_macbook",
    name: "MacBook Pro — Dev",
    version: "0.0.0-dev",
    status: "idle",
    machine: "MacBook Pro M3 Pro",
    platform: "macOS",
    lastHeartbeat: new Date(Date.now() - 120_000).toISOString(),
    jobsCompleted: 38,
    jobsRunning: 0,
  },
  {
    id: "worker_ubuntu",
    name: "Ubuntu VPS — Production",
    version: "0.0.0-dev",
    status: "online",
    machine: "Hetzner CX42",
    platform: "Ubuntu 24.04",
    lastHeartbeat: new Date(Date.now() - 15_000).toISOString(),
    jobsCompleted: 891,
    jobsRunning: 2,
  },
  {
    id: "worker_windows",
    name: "Windows Desktop — Legacy",
    version: "0.0.0-dev",
    status: "offline",
    machine: "Custom PC",
    platform: "Windows 11",
    lastHeartbeat: new Date(Date.now() - 3_600_000).toISOString(),
    jobsCompleted: 12,
    jobsRunning: 0,
  },
];

const mockLogs = new Map<string, WorkerLogDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockWorkerStore = {
  listWorkers(): WorkerDocument[] {
    return [...mockWorkers];
  },

  getWorker(id: string): WorkerDocument | null {
    return mockWorkers.find((worker) => worker.id === id) ?? null;
  },

  createWorkerLog(input: CreateWorkerLogInput): WorkerLogDocument {
    const id = generateId("wlog");
    const log: WorkerLogDocument = { ...input, id };
    mockLogs.set(id, log);
    return log;
  },

  listWorkerLogs(): WorkerLogDocument[] {
    return [...mockLogs.values()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },

  hasLogs(): boolean {
    return mockLogs.size > 0;
  },
};
