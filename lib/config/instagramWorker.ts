function readNumber(value: string | undefined, defaultValue: number): number {
  if (value == null || value.trim() === "") return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

export const INSTAGRAM_WORKER_CONFIG = {
  batchSize: readNumber(process.env.INSTAGRAM_WORKER_BATCH_SIZE, 1),
  delayMs: readNumber(process.env.INSTAGRAM_WORKER_DELAY_MS, 5000),
  maxRetries: readNumber(process.env.INSTAGRAM_WORKER_MAX_RETRIES, 1),
  timeoutMs: readNumber(process.env.INSTAGRAM_WORKER_TIMEOUT_MS, 30000),
} as const;

export function getInstagramWorkerBatchSize(): number {
  return Math.max(1, INSTAGRAM_WORKER_CONFIG.batchSize);
}

export function getInstagramWorkerDelayMs(): number {
  return INSTAGRAM_WORKER_CONFIG.delayMs;
}

export function getInstagramWorkerMaxRetries(): number {
  return INSTAGRAM_WORKER_CONFIG.maxRetries;
}

export function getInstagramWorkerTimeoutMs(): number {
  return INSTAGRAM_WORKER_CONFIG.timeoutMs;
}
