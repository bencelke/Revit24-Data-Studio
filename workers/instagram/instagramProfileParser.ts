/**
 * Legacy parser — adapts lib provider parser for backward compatibility.
 */
import type { ExtractionError, ExtractionErrorCode, ProfileMetadata } from "@/lib/types/profile-extraction";
import type { InstagramExtractorErrorCode } from "@/lib/providers/instagram/instagramPublicProfileTypes";
import {
  buildMockInstagramPublicProfile,
  parseInstagramPublicProfilePage,
} from "./instagramPublicProfileParser";
import { extractEmailFromText } from "@/lib/utils/instagramMetadata";

const LEGACY_ERROR_MAP: Record<InstagramExtractorErrorCode, ExtractionErrorCode> = {
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

export interface InstagramParseInput {
  html: string;
  username: string;
  profileUrl: string;
  httpStatus: number;
}

export interface InstagramParsedProfile {
  metadata: ProfileMetadata;
  rawJson: Record<string, unknown>;
}

export function createExtractionError(
  code: ExtractionErrorCode,
  message: string,
  retryable = false,
): ExtractionError {
  return { code, message, retryable };
}

/** @deprecated Use extractEmailFromText */
export function extractPublicEmailFromBio(bio: string | null): string | null {
  return extractEmailFromText(bio);
}

/** @deprecated Public phone extraction removed */
export function extractPublicPhoneFromBio(): string | null {
  return null;
}

export function parseInstagramPublicProfile(input: {
  html: string;
  username: string;
  profileUrl: string;
  httpStatus: number;
}): { success: true; profile: InstagramParsedProfile } | { success: false; error: ExtractionError } {
  const parsed = parseInstagramPublicProfilePage({
    ...input,
    extractedAt: new Date().toISOString(),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: {
        code: LEGACY_ERROR_MAP[parsed.error.code],
        message: parsed.error.message,
        retryable: parsed.error.retryable,
      },
    };
  }

  const metadata = parsed.data;

  return {
    success: true,
    profile: {
      metadata: {
        platform: "instagram",
        username: metadata.username,
        displayName: metadata.displayName,
        bio: metadata.bio,
        profileUrl: metadata.profileUrl,
        profileImageUrl: metadata.profileImageUrl,
        website: metadata.website,
        publicEmail: metadata.publicEmail,
        publicPhone: null,
        followers: null,
        following: null,
        posts: null,
        verified: false,
        businessCategory: null,
      },
      rawJson: { username: metadata.username },
    },
  };
}

export function buildMockInstagramProfile(
  username: string,
  profileUrl: string,
): InstagramParsedProfile {
  const mock = buildMockInstagramPublicProfile(username, profileUrl);
  return {
    metadata: {
      platform: "instagram",
      username: mock.username,
      displayName: mock.displayName,
      bio: mock.bio,
      profileUrl: mock.profileUrl,
      profileImageUrl: mock.profileImageUrl,
      website: mock.website,
      publicEmail: mock.publicEmail,
      publicPhone: null,
      followers: null,
      following: null,
      posts: null,
      verified: false,
      businessCategory: null,
    },
    rawJson: { mock: true, username },
  };
}
