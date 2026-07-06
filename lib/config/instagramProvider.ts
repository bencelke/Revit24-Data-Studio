function readBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value == null || value.trim() === "") return defaultValue;
  return value === "true" || value === "1";
}

function readNumber(value: string | undefined, defaultValue: number): number {
  if (value == null || value.trim() === "") return defaultValue;
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : defaultValue;
}

export const INSTAGRAM_PROVIDER_CONFIG = {
  /** Must be explicitly enabled. Defaults to false for safe rollout. */
  enabled: readBoolean(process.env.ENABLE_INSTAGRAM_EXTRACTION, false),

  /** Delay between sequential profile extractions (ms). */
  delayMs: readNumber(process.env.INSTAGRAM_EXTRACTION_DELAY_MS, 5000),

  /** Per-request fetch timeout (ms). */
  timeoutMs: readNumber(process.env.INSTAGRAM_EXTRACTION_TIMEOUT_MS, 30000),

  /** Max retries per profile on retryable errors. */
  maxRetries: readNumber(process.env.INSTAGRAM_EXTRACTION_MAX_RETRIES, 1),

  /** Legacy mock override — forces mock even when enabled. */
  forceMock: process.env.INSTAGRAM_EXTRACTION_MODE === "mock",
} as const;

export function isInstagramExtractionEnabled(): boolean {
  return INSTAGRAM_PROVIDER_CONFIG.enabled && !INSTAGRAM_PROVIDER_CONFIG.forceMock;
}

export function shouldUseInstagramMockExtraction(): boolean {
  return !INSTAGRAM_PROVIDER_CONFIG.enabled || INSTAGRAM_PROVIDER_CONFIG.forceMock;
}

export function getInstagramExtractionDelayMs(): number {
  return INSTAGRAM_PROVIDER_CONFIG.delayMs;
}

export function getInstagramExtractionTimeoutMs(): number {
  return INSTAGRAM_PROVIDER_CONFIG.timeoutMs;
}

export function getInstagramExtractionMaxRetries(): number {
  return INSTAGRAM_PROVIDER_CONFIG.maxRetries;
}
