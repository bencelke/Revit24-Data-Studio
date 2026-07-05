export const WEBSITE_CONFIG = {
  respectRobotsTxt: process.env.WEBSITE_RESPECT_ROBOTS_TXT !== "false",
  maxUrlsPerJob: Number(process.env.WEBSITE_MAX_URLS_PER_JOB ?? 100),
  extractionTimeoutMs: Number(process.env.WEBSITE_EXTRACTION_TIMEOUT_MS ?? 15_000),
  workerEnabled: process.env.WEBSITE_WORKER_ENABLED === "true",
  mockMode: process.env.WEBSITE_EXTRACTION_MODE !== "live",
} as const;

export function isWebsiteWorkerAvailable(): boolean {
  return WEBSITE_CONFIG.workerEnabled && !WEBSITE_CONFIG.mockMode;
}
