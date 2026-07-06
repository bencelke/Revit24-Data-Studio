import { normalizeInstagramInput } from "@/lib/validation/instagramProfileInput";
import {
  getInstagramExtractionDelayMs,
  getInstagramExtractionMaxRetries,
  getInstagramExtractionTimeoutMs,
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramExtractor";
import {
  buildMockInstagramPublicProfile,
  parseInstagramPublicProfilePage,
} from "./instagramPublicProfileParser";
import { createInstagramExtractorError, isRetryableExtractorError } from "./instagramPublicProfileErrors";
import type {
  InstagramExtractionResult,
  InstagramPublicProfileProvider,
} from "./instagramPublicProfileTypes";

const PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildResult(
  partial: Omit<InstagramExtractionResult, "durationMs" | "mock">,
  startedAt: number,
  mock: boolean,
): InstagramExtractionResult {
  return {
    ...partial,
    durationMs: Date.now() - startedAt,
    mock,
  };
}

async function fetchPublicProfile(profileUrl: string): Promise<Response> {
  const controller = new AbortController();
  const timeoutMs = getInstagramExtractionTimeoutMs();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(profileUrl, {
      method: "GET",
      headers: {
        "User-Agent": PUBLIC_USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
      redirect: "follow",
    });
  } finally {
    clearTimeout(timeout);
  }
}

export class InstagramPublicProfileProviderImpl implements InstagramPublicProfileProvider {
  async extractProfile(input: string): Promise<InstagramExtractionResult> {
    const startedAt = Date.now();
    const normalized = normalizeInstagramInput(input.trim());

    if (!normalized.username || !normalized.profileUrl || normalized.error) {
      return buildResult(
        {
          success: false,
          data: null,
          errorCode: "invalid_input",
          error: normalized.error ?? "Invalid Instagram profile input.",
        },
        startedAt,
        false,
      );
    }

    if (!isInstagramExtractionEnabled()) {
      if (shouldUseInstagramMockExtraction()) {
        return buildResult(
          {
            success: true,
            data: buildMockInstagramPublicProfile(normalized.username, normalized.profileUrl),
            errorCode: "success",
            error: null,
          },
          startedAt,
          true,
        );
      }

      return buildResult(
        {
          success: false,
          data: null,
          errorCode: "disabled",
          error: "Instagram extraction is disabled. Set ENABLE_INSTAGRAM_EXTRACTION=true.",
        },
        startedAt,
        false,
      );
    }

    const maxRetries = getInstagramExtractionMaxRetries();
    let lastError = createInstagramExtractorError("unknown_error", "Extraction failed.");

    for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
      if (attempt > 1) {
        await sleep(getInstagramExtractionDelayMs());
      }

      const attemptResult = await this.extractOnce(
        normalized.username,
        normalized.profileUrl,
        startedAt,
      );

      if (attemptResult.success) {
        return attemptResult;
      }

      if (attemptResult.errorCode !== "success" && attemptResult.error) {
        lastError = createInstagramExtractorError(attemptResult.errorCode, attemptResult.error);
      }

      if (!isRetryableExtractorError(lastError.code)) {
        return attemptResult;
      }
    }

    return buildResult(
      {
        success: false,
        data: null,
        errorCode: lastError.code,
        error: lastError.message,
      },
      startedAt,
      false,
    );
  }

  private async extractOnce(
    username: string,
    profileUrl: string,
    startedAt: number,
  ): Promise<InstagramExtractionResult> {
    const extractedAt = new Date().toISOString();

    try {
      const response = await fetchPublicProfile(profileUrl);
      const html = await response.text();

      const parsed = parseInstagramPublicProfilePage({
        html,
        username,
        profileUrl,
        httpStatus: response.status,
        extractedAt,
      });

      if (!parsed.success) {
        return buildResult(
          {
            success: false,
            data: null,
            errorCode: parsed.error.code,
            error: parsed.error.message,
          },
          startedAt,
          false,
        );
      }

      return buildResult(
        {
          success: true,
          data: parsed.data,
          errorCode: "success",
          error: null,
        },
        startedAt,
        false,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network request failed.";
      const isTimeout = message.toLowerCase().includes("abort");

      return buildResult(
        {
          success: false,
          data: null,
          errorCode: isTimeout ? "network_timeout" : "unknown_error",
          error: message,
        },
        startedAt,
        false,
      );
    }
  }
}

export const instagramPublicProfileProvider = new InstagramPublicProfileProviderImpl();
