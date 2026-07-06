import type {
  ProfileExtractionInput,
  ProfileExtractionProvider,
  ProfileExtractionResult,
} from "@/lib/types/profile-extraction";
import { isInstagramExtractionEnabled } from "@/lib/config/instagramExtractor";
import { instagramPublicProfileProvider } from "@/lib/providers/instagram";
import type { InstagramExtractorErrorCode } from "@/lib/providers/instagram/instagramPublicProfileTypes";
import type { ExtractionErrorCode } from "@/lib/types/profile-extraction";
import { INSTAGRAM_EXTRACTOR_VERSION } from "@/lib/providers/instagram/instagramPublicProfileTypes";

const ERROR_CODE_MAP: Record<InstagramExtractorErrorCode, ExtractionErrorCode> = {
  success: "UNKNOWN",
  invalid_input: "INVALID_INPUT",
  profile_not_found: "PROFILE_NOT_FOUND",
  profile_private: "PRIVATE_PROFILE",
  profile_unavailable: "PROFILE_UNAVAILABLE",
  parse_failed: "PARSE_FAILED",
  network_timeout: "TIMEOUT",
  rate_limited: "RATE_LIMITED",
  blocked: "BLOCKED",
  disabled: "UNKNOWN",
  unknown_error: "UNKNOWN",
};

export class InstagramPublicProfileProvider implements ProfileExtractionProvider {
  readonly platform = "instagram";
  readonly version = INSTAGRAM_EXTRACTOR_VERSION;

  async extractProfile(input: ProfileExtractionInput): Promise<ProfileExtractionResult> {
    const raw = input.profileUrl ?? input.username ?? "";
    const result = await instagramPublicProfileProvider.extractProfile(raw);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: {
          code: ERROR_CODE_MAP[result.errorCode],
          message: result.error ?? "Extraction failed.",
          retryable: ["network_timeout", "rate_limited", "blocked", "profile_unavailable", "parse_failed", "unknown_error"].includes(
            result.errorCode,
          ),
        },
        durationMs: result.durationMs,
        workerVersion: this.version,
      };
    }

    return {
      success: true,
      data: {
        platform: "instagram",
        username: result.data.username,
        displayName: result.data.displayName,
        bio: result.data.bio,
        profileUrl: result.data.profileUrl,
        profileImageUrl: result.data.profileImageUrl,
        website: result.data.website,
        publicEmail: result.data.publicEmail,
        publicPhone: null,
        followers: null,
        following: null,
        posts: null,
        verified: false,
        businessCategory: null,
      },
      error: null,
      durationMs: result.durationMs,
      workerVersion: this.version,
    };
  }
}

export const defaultInstagramPublicProfileProvider = new InstagramPublicProfileProvider();

export function isInstagramProviderLive(): boolean {
  return isInstagramExtractionEnabled();
}
