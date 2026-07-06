import { shouldUseInstagramMockExtraction } from "@/lib/config/instagramExtractor";

export const INSTAGRAM_WORKER_VERSION = "1.0.0-public";
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export const INSTAGRAM_PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export {
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramExtractor";

/** @deprecated Use shouldUseInstagramMockExtraction from instagramExtractor config */
export function isInstagramMockExtractionEnabled(): boolean {
  return shouldUseInstagramMockExtraction();
}
