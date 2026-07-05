export const WORKER_RUNTIME_VERSION = "0.1.0-mvp";

export const RUNTIME_CONFIG = {
  pollingIntervalMs: Number(process.env.WORKER_POLLING_INTERVAL_MS ?? 5_000),
  heartbeatIntervalMs: Number(process.env.WORKER_HEARTBEAT_INTERVAL_MS ?? 30_000),
  heartbeatExpiryMs: Number(process.env.WORKER_HEARTBEAT_EXPIRY_MS ?? 90_000),
  maxRetryAttempts: Number(process.env.WORKER_MAX_RETRY_ATTEMPTS ?? 3),
  retryDelayMs: Number(process.env.WORKER_RETRY_DELAY_MS ?? 5_000),
  batchSize: Number(process.env.WORKER_BATCH_SIZE ?? 50),
  workerName: process.env.WORKER_NAME ?? "Revit24 Worker",
  workerVersion: process.env.WORKER_VERSION ?? WORKER_RUNTIME_VERSION,
  environment: process.env.WORKER_ENVIRONMENT ?? process.env.NODE_ENV ?? "development",
} as const;

export type RuntimeConfig = typeof RUNTIME_CONFIG;
