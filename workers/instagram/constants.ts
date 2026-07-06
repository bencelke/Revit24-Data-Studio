import { shouldUseInstagramMockExtraction } from "@/lib/config/instagramProvider";

export const INSTAGRAM_WORKER_VERSION = "0.2.0-public";
export const DEFAULT_FETCH_TIMEOUT_MS = 30_000;

export const INSTAGRAM_PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

export {
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";

/** @deprecated Use shouldUseInstagramMockExtraction from instagramProvider config */
export function isInstagramMockExtractionEnabled(): boolean {
  return shouldUseInstagramMockExtraction();
}
