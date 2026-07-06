import { normalizeInstagramInput } from "@/lib/validation/instagramProfileInput";
import {
  getInstagramExtractionDelayMs,
  getInstagramExtractionMaxRetries,
  getInstagramExtractionTimeoutMs,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";
import type {
  InstagramPublicProfileExtractionResult,
  InstagramPublicProfileMetadata,
} from "./instagramPublicProfileTypes";
import { createPublicProfileError } from "./instagramPublicProfileTypes";
import {
  buildMockInstagramPublicProfile,
  parseInstagramPublicProfilePage,
} from "./instagramPublicProfileParser";
import { INSTAGRAM_PUBLIC_USER_AGENT, INSTAGRAM_WORKER_VERSION } from "./constants";

const RETRYABLE_CODES = new Set([
  "network_timeout",
  "rate_limited",
  "blocked",
  "profile_unavailable",
  "parse_failed",
  "unknown_error",
]);

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class InstagramPublicProfileExtractor {
  readonly version = INSTAGRAM_WORKER_VERSION;

  async extract(input: {
    profileUrl?: string | null;
    username?: string | null;
  }): Promise<InstagramPublicProfileExtractionResult> {
    const startedAt = Date.now();
    const normalized = this.normalizeInput(input);

    if (normalized.error || !normalized.username || !normalized.profileUrl) {
      return {
        success: false,
        data: null,
        error: createPublicProfileError(
          "unknown_error",
          normalized.error ?? "Invalid Instagram profile input.",
          false,
        ),
        durationMs: Date.now() - startedAt,
        workerVersion: this.version,
        attempts: 0,
      };
    }

    if (shouldUseInstagramMockExtraction()) {
      const mock = buildMockInstagramPublicProfile(
        normalized.username,
        normalized.profileUrl,
        this.version,
      );
      return {
        success: true,
        data: mock.metadata,
        error: null,
        durationMs: Date.now() - startedAt,
        workerVersion: this.version,
        attempts: 1,
      };
    }

    const maxRetries = getInstagramExtractionMaxRetries();
    let lastError = createPublicProfileError("unknown_error", "Extraction failed.", false);

    for (let attempt = 1; attempt <= maxRetries + 1; attempt += 1) {
      if (attempt > 1) {
        await sleep(getInstagramExtractionDelayMs());
      }

      const attemptResult = await this.extractOnce(
        normalized.username,
        normalized.profileUrl,
      );

      if (attemptResult.success) {
        return {
          ...attemptResult,
          durationMs: Date.now() - startedAt,
          attempts: attempt,
        };
      }

      lastError = attemptResult.error ?? lastError;

      if (!lastError.retryable || !RETRYABLE_CODES.has(lastError.code)) {
        break;
      }

      if (attempt <= maxRetries) {
        await sleep(getInstagramExtractionDelayMs());
      }
    }

    return {
      success: false,
      data: null,
      error: lastError,
      durationMs: Date.now() - startedAt,
      workerVersion: this.version,
      attempts: maxRetries + 1,
    };
  }

  private normalizeInput(input: {
    profileUrl?: string | null;
    username?: string | null;
  }): { username: string | null; profileUrl: string | null; error: string | null } {
    const raw = input.profileUrl ?? input.username ?? "";
    return normalizeInstagramInput(raw);
  }

  private async extractOnce(
    username: string,
    profileUrl: string,
  ): Promise<InstagramPublicProfileExtractionResult> {
    const startedAt = Date.now();
    const extractedAt = new Date().toISOString();

    try {
      const response = await this.fetchPublicProfile(profileUrl);
      const html = await response.text();

      const parsed = parseInstagramPublicProfilePage({
        html,
        username,
        profileUrl,
        httpStatus: response.status,
        workerVersion: this.version,
        extractedAt,
      });

      if (!parsed.success) {
        return {
          success: false,
          data: null,
          error: parsed.error,
          durationMs: Date.now() - startedAt,
          workerVersion: this.version,
          attempts: 1,
        };
      }

      return {
        success: true,
        data: parsed.result.metadata,
        error: null,
        durationMs: Date.now() - startedAt,
        workerVersion: this.version,
        attempts: 1,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network request failed.";
      const isTimeout = message.toLowerCase().includes("abort");

      return {
        success: false,
        data: null,
        error: createPublicProfileError(
          isTimeout ? "network_timeout" : "unknown_error",
          message,
          true,
        ),
        durationMs: Date.now() - startedAt,
        workerVersion: this.version,
        attempts: 1,
      };
    }
  }

  private async fetchPublicProfile(profileUrl: string): Promise<Response> {
    const controller = new AbortController();
    const timeoutMs = getInstagramExtractionTimeoutMs();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      return await fetch(profileUrl, {
        method: "GET",
        headers: {
          "User-Agent": INSTAGRAM_PUBLIC_USER_AGENT,
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

  toProfileMetadata(data: InstagramPublicProfileMetadata) {
    return {
      platform: "instagram" as const,
      username: data.username,
      displayName: data.displayName,
      bio: data.bio,
      profileUrl: data.profileUrl,
      profileImageUrl: data.profileImageUrl,
      website: data.website,
      publicEmail: data.publicEmail,
      publicPhone: data.publicPhone,
      followers: data.followers,
      following: data.following,
      posts: data.posts,
      verified: data.verified,
      businessCategory: data.businessCategory,
    };
  }
}

export const defaultInstagramPublicProfileExtractor = new InstagramPublicProfileExtractor();
