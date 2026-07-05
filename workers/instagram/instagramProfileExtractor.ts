import { normalizeInstagramInput } from "@/lib/validation/instagramProfileInput";
import type {
  ProfileExtractionInput,
  ProfileExtractionProvider,
  ProfileExtractionResult,
} from "@/lib/types/profile-extraction";
import {
  DEFAULT_FETCH_TIMEOUT_MS,
  INSTAGRAM_PUBLIC_USER_AGENT,
  INSTAGRAM_WORKER_VERSION,
  isInstagramMockExtractionEnabled,
} from "./constants";
import {
  buildMockInstagramProfile,
  createExtractionError,
  parseInstagramPublicProfile,
} from "./instagramProfileParser";

export class InstagramProfileExtractor implements ProfileExtractionProvider {
  readonly platform = "instagram";
  readonly version = INSTAGRAM_WORKER_VERSION;

  async extractProfile(input: ProfileExtractionInput): Promise<ProfileExtractionResult> {
    const startedAt = Date.now();

    const normalized = this.normalizeInput(input);
    if (normalized.error || !normalized.username || !normalized.profileUrl) {
      return {
        success: false,
        data: null,
        error: createExtractionError(
          "INVALID_INPUT",
          normalized.error ?? "Invalid Instagram profile input.",
          false,
        ),
        durationMs: Date.now() - startedAt,
        workerVersion: this.version,
      };
    }

    if (isInstagramMockExtractionEnabled()) {
      return this.buildSuccessResult(
        buildMockInstagramProfile(normalized.username, normalized.profileUrl),
        startedAt,
      );
    }

    try {
      const response = await this.fetchPublicProfile(normalized.profileUrl);
      const html = await response.text();

      const parsed = parseInstagramPublicProfile({
        html,
        username: normalized.username,
        profileUrl: normalized.profileUrl,
        httpStatus: response.status,
      });

      if (!parsed.success) {
        return {
          success: false,
          data: null,
          error: parsed.error,
          durationMs: Date.now() - startedAt,
          workerVersion: this.version,
        };
      }

      return this.buildSuccessResult(parsed.profile, startedAt);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Network request failed.";
      const isTimeout = message.toLowerCase().includes("abort");

      return {
        success: false,
        data: null,
        error: createExtractionError(
          isTimeout ? "TIMEOUT" : "NETWORK_FAILURE",
          message,
          true,
        ),
        durationMs: Date.now() - startedAt,
        workerVersion: this.version,
      };
    }
  }

  private normalizeInput(input: ProfileExtractionInput): {
    username: string | null;
    profileUrl: string | null;
    error: string | null;
  } {
    const raw = input.profileUrl ?? input.username ?? "";
    return normalizeInstagramInput(raw);
  }

  private async fetchPublicProfile(profileUrl: string): Promise<Response> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), DEFAULT_FETCH_TIMEOUT_MS);

    try {
      const response = await fetch(profileUrl, {
        method: "GET",
        headers: {
          "User-Agent": INSTAGRAM_PUBLIC_USER_AGENT,
          Accept: "text/html,application/xhtml+xml",
          "Accept-Language": "en-US,en;q=0.9",
        },
        signal: controller.signal,
        redirect: "follow",
      });

      return response;
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildSuccessResult(
    profile: ReturnType<typeof buildMockInstagramProfile>,
    startedAt: number,
  ): ProfileExtractionResult {
    return {
      success: true,
      data: profile.metadata,
      error: null,
      durationMs: Date.now() - startedAt,
      workerVersion: this.version,
    };
  }
}

export const defaultInstagramProfileExtractor = new InstagramProfileExtractor();
