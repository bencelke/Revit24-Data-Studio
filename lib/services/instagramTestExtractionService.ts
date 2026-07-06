import {
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
  INSTAGRAM_PROVIDER_CONFIG,
} from "@/lib/config/instagramProvider";
import type { InstagramPublicProfileExtractionResult } from "@/workers/instagram/instagramPublicProfileTypes";
import { defaultInstagramPublicProfileExtractor } from "@/workers/instagram/instagramPublicProfileExtractor";

export interface InstagramTestExtractionPageData {
  enabled: boolean;
  mockMode: boolean;
  config: {
    delayMs: number;
    timeoutMs: number;
    maxRetries: number;
  };
}

export interface InstagramTestExtractionResult extends InstagramPublicProfileExtractionResult {
  rawSummary: Record<string, unknown> | null;
}

export function getInstagramTestExtractionPageData(): InstagramTestExtractionPageData {
  return {
    enabled: isInstagramExtractionEnabled(),
    mockMode: shouldUseInstagramMockExtraction(),
    config: {
      delayMs: INSTAGRAM_PROVIDER_CONFIG.delayMs,
      timeoutMs: INSTAGRAM_PROVIDER_CONFIG.timeoutMs,
      maxRetries: INSTAGRAM_PROVIDER_CONFIG.maxRetries,
    },
  };
}

export async function runInstagramTestExtraction(
  input: string,
  options?: { forceMock?: boolean },
): Promise<InstagramTestExtractionResult> {
  const useMock = options?.forceMock || shouldUseInstagramMockExtraction();

  if (!isInstagramExtractionEnabled() && !useMock) {
    return {
      success: false,
      data: null,
      error: {
        code: "unknown_error",
        message: "Instagram extraction is disabled. Set ENABLE_INSTAGRAM_EXTRACTION=true to enable.",
        retryable: false,
      },
      durationMs: 0,
      workerVersion: defaultInstagramPublicProfileExtractor.version,
      attempts: 0,
      rawSummary: null,
    };
  }

  const result = await defaultInstagramPublicProfileExtractor.extract({
    profileUrl: input.includes("instagram") ? input : undefined,
    username: input.includes("instagram") ? undefined : input.replace(/^@/, ""),
  });

  return {
    ...result,
    rawSummary: result.data
      ? {
          username: result.data.username,
          displayName: result.data.displayName,
          bio: result.data.bio,
          followers: result.data.followers,
          following: result.data.following,
          posts: result.data.posts,
          verified: result.data.verified,
          mock: useMock,
        }
      : null,
  };
}
