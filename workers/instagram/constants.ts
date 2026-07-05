export const INSTAGRAM_WORKER_VERSION = "0.1.0-mvp";
export const DEFAULT_FETCH_TIMEOUT_MS = 15_000;

export const INSTAGRAM_PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export function isInstagramMockExtractionEnabled(): boolean {
  return process.env.INSTAGRAM_EXTRACTION_MODE === "mock";
}
