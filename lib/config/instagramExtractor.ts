function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  return value === "true" || value === "1";
}

function readNumber(value: string | undefined, defaultValue: number): number {
  if (value == null || value.trim() === "") return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

function isExtractionFlagEnabled(): boolean {
  return (
    readBoolean(process.env.ENABLE_INSTAGRAM_EXTRACTION, false) ||
    readBoolean(process.env.NEXT_PUBLIC_ENABLE_INSTAGRAM_EXTRACTION, false)
  );
}

export const INSTAGRAM_EXTRACTOR_CONFIG = {
  /** Must be explicitly enabled via server or public env flag. Defaults to false. */
  enabled: isExtractionFlagEnabled(),

  /** Delay between sequential profile extractions (ms). */
  delayMs: readNumber(process.env.INSTAGRAM_EXTRACTION_DELAY_MS, 5000),

  /** Per-request fetch timeout (ms). */
  timeoutMs: readNumber(process.env.INSTAGRAM_EXTRACTION_TIMEOUT_MS, 30000),

  /** Max retries per profile on retryable errors. */
  maxRetries: readNumber(process.env.INSTAGRAM_EXTRACTION_MAX_RETRIES, 1),

  /** Profiles processed per worker cycle (legacy runtime). */
  batchSize: readNumber(process.env.INSTAGRAM_EXTRACTION_BATCH_SIZE, 1),

  /** Legacy mock override — forces mock even when enabled. */
  forceMock: process.env.INSTAGRAM_EXTRACTION_MODE === "mock",
} as const;

export function isInstagramExtractionEnabled(): boolean {
  return INSTAGRAM_EXTRACTOR_CONFIG.enabled && !INSTAGRAM_EXTRACTOR_CONFIG.forceMock;
}

/** Client-safe extraction flag (reads NEXT_PUBLIC_ENABLE_INSTAGRAM_EXTRACTION). */
export function isInstagramExtractionEnabledOnClient(): boolean {
  return (
    readBoolean(process.env.NEXT_PUBLIC_ENABLE_INSTAGRAM_EXTRACTION, false) &&
    process.env.INSTAGRAM_EXTRACTION_MODE !== "mock"
  );
}

export function shouldUseInstagramMockExtraction(): boolean {
  return !INSTAGRAM_EXTRACTOR_CONFIG.enabled || INSTAGRAM_EXTRACTOR_CONFIG.forceMock;
}

export function getInstagramExtractionDelayMs(): number {
  return INSTAGRAM_EXTRACTOR_CONFIG.delayMs;
}

export function getInstagramExtractionTimeoutMs(): number {
  return INSTAGRAM_EXTRACTOR_CONFIG.timeoutMs;
}

export function getInstagramExtractionMaxRetries(): number {
  return INSTAGRAM_EXTRACTOR_CONFIG.maxRetries;
}

export function getInstagramExtractionBatchSize(): number {
  return Math.max(1, INSTAGRAM_EXTRACTOR_CONFIG.batchSize);
}
