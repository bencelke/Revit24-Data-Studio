export const WORKER_STATUSES = [
  "online",
  "offline",
  "busy",
  "idle",
  "maintenance",
] as const;

export const WORKER_LOG_LEVELS = ["debug", "info", "warning", "error"] as const;

export type WorkerStatus = (typeof WORKER_STATUSES)[number];
export type WorkerLogLevel = (typeof WORKER_LOG_LEVELS)[number];

export interface WorkerDocument {
  id: string;
  name: string;
  hostname: string;
  machineName: string;
  version: string;
  status: WorkerStatus;
  machine: string;
  platform: string;
  environment: string;
  startedAt: string;
  lastHeartbeat: string;
  currentJob: string | null;
  jobsCompleted: number;
  jobsRunning: number;
  cpuUsagePercent: number | null;
  memoryUsagePercent: number | null;
}

export interface WorkerLogDocument {
  id: string;
  timestamp: string;
  workerId: string;
  workerName: string;
  level: WorkerLogLevel;
  event: string;
  jobId: string | null;
  message: string;
}

export type CreateWorkerLogInput = Omit<WorkerLogDocument, "id">;
export type CreateWorkerInput = Omit<WorkerDocument, "id">;

export interface WorkerLogsFilterParams {
  search?: string;
  level?: WorkerLogLevel | "all";
  workerId?: string | "all";
  page?: number;
  pageSize?: number;
}

export interface WorkerLogsListResult {
  logs: WorkerLogDocument[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface WorkersPageData {
  workers: WorkerDocument[];
  dataMode: import("./queue").QueueDataMode;
  firebaseConfigured: boolean;
}

export interface WorkerLogsPageData {
  logs: WorkerLogDocument[];
  workers: WorkerDocument[];
  dataMode: import("./queue").QueueDataMode;
  firebaseConfigured: boolean;
}
