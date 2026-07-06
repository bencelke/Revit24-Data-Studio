import { instagramPublicProfileProvider } from "@/lib/providers/instagram";
import { INSTAGRAM_EXTRACTOR_VERSION } from "@/lib/providers/instagram/instagramPublicProfileTypes";
import type { InstagramExtractorErrorCode } from "@/lib/providers/instagram/instagramPublicProfileTypes";
import type {
  InstagramPublicProfileExtractionResult,
  InstagramPublicProfileMetadata,
  InstagramPublicProfileErrorCode,
} from "./instagramPublicProfileTypes";
import { createPublicProfileError } from "./instagramPublicProfileTypes";
import type { ProfileExtractionInput } from "@/lib/types/profile-extraction";

function mapErrorCode(code: InstagramExtractorErrorCode): InstagramPublicProfileErrorCode {
  if (code === "invalid_input" || code === "disabled" || code === "success") {
    return "unknown_error";
  }
  return code;
}

export class InstagramPublicProfileExtractor {
  readonly version = INSTAGRAM_EXTRACTOR_VERSION;

  async extract(input: ProfileExtractionInput): Promise<InstagramPublicProfileExtractionResult> {
    const raw = input.profileUrl ?? input.username ?? "";
    const result = await instagramPublicProfileProvider.extractProfile(raw);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: createPublicProfileError(
          mapErrorCode(result.errorCode),
          result.error ?? "Extraction failed.",
          [
            "network_timeout",
            "rate_limited",
            "blocked",
            "profile_unavailable",
            "parse_failed",
            "unknown_error",
          ].includes(result.errorCode),
        ),
        durationMs: result.durationMs,
        workerVersion: this.version,
        attempts: 1,
      };
    }

    const metadata: InstagramPublicProfileMetadata = {
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
      extractedAt: result.data.extractedAt,
      workerVersion: this.version,
      status: result.mock ? "completed" : "completed",
    };

    return {
      success: true,
      data: metadata,
      error: null,
      durationMs: result.durationMs,
      workerVersion: this.version,
      attempts: 1,
    };
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
