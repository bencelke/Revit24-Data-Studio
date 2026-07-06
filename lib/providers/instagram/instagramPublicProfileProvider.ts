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
import {
  createInstagramExtractorError,
  isRetryableExtractorError,
  normalizeExtractorErrorCode,
} from "./instagramPublicProfileErrors";
import type {
  InstagramExtractionDiagnostics,
  InstagramExtractionResult,
  InstagramPublicProfileProvider,
} from "./instagramPublicProfileTypes";

const PUBLIC_USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildDiagnostics(
  profileUrl: string,
  httpStatus: number | null = null,
  step: string | null = null,
): InstagramExtractionDiagnostics {
  return {
    fetchUrl: profileUrl,
    httpStatus,
    step,
  };
}

function buildResult(
  partial: Omit<InstagramExtractionResult, "durationMs" | "mock" | "diagnostics"> & {
    diagnostics?: InstagramExtractionDiagnostics;
  },
  startedAt: number,
  mock: boolean,
  profileUrl: string,
): InstagramExtractionResult {
  return {
    ...partial,
    errorCode: normalizeExtractorErrorCode(partial.errorCode),
    durationMs: Date.now() - startedAt,
    mock,
    diagnostics: partial.diagnostics ?? buildDiagnostics(profileUrl),
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
        "Cache-Control": "no-cache",
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
          diagnostics: buildDiagnostics(input, null, "normalize_input"),
        },
        startedAt,
        false,
        input,
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
            diagnostics: buildDiagnostics(normalized.profileUrl),
          },
          startedAt,
          true,
          normalized.profileUrl,
        );
      }

      return buildResult(
        {
          success: false,
          data: null,
          errorCode: "disabled",
          error: "Instagram extraction is disabled. Set ENABLE_INSTAGRAM_EXTRACTION=true.",
          diagnostics: buildDiagnostics(normalized.profileUrl, null, "config"),
        },
        startedAt,
        false,
        normalized.profileUrl,
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
        lastError = createInstagramExtractorError(attemptResult.errorCode, attemptResult.error, {
          httpStatus: attemptResult.diagnostics.httpStatus,
          step: attemptResult.diagnostics.step,
        });
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
        diagnostics: buildDiagnostics(
          normalized.profileUrl,
          lastError.httpStatus,
          lastError.step,
        ),
      },
      startedAt,
      false,
      normalized.profileUrl,
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
            diagnostics: buildDiagnostics(profileUrl, parsed.error.httpStatus, parsed.error.step),
          },
          startedAt,
          false,
          profileUrl,
        );
      }

      return buildResult(
        {
          success: true,
          data: parsed.data,
          errorCode: "success",
          error: null,
          diagnostics: buildDiagnostics(profileUrl, response.status, "parse_metadata"),
        },
        startedAt,
        false,
        profileUrl,
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network request failed.";
      const isTimeout = message.toLowerCase().includes("abort");

      return buildResult(
        {
          success: false,
          data: null,
          errorCode: isTimeout ? "network_timeout" : "unknown_error",
          error: isTimeout ? "Instagram profile request timed out." : message,
          diagnostics: buildDiagnostics(profileUrl, null, "fetch_profile"),
        },
        startedAt,
        false,
        profileUrl,
      );
    }
  }
}

export const instagramPublicProfileProvider = new InstagramPublicProfileProviderImpl();
