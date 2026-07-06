/**
 * Legacy parser — re-exports from instagramPublicProfileParser for backward compatibility.
 */
import type { ExtractionError, ProfileMetadata } from "@/lib/types/profile-extraction";
import {
  buildMockInstagramPublicProfile,
  extractPublicEmailFromBio,
  extractPublicPhoneFromBio,
  parseInstagramPublicProfilePage,
} from "./instagramPublicProfileParser";
import { mapPublicProfileErrorToExtractionError } from "./instagramPublicProfileTypes";
import { INSTAGRAM_WORKER_VERSION } from "./constants";

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
  code: import("@/lib/types/profile-extraction").ExtractionErrorCode,
  message: string,
  retryable = false,
): ExtractionError {
  return { code, message, retryable };
}

export { extractPublicEmailFromBio, extractPublicPhoneFromBio };

export function parseInstagramPublicProfile(input: {
  html: string;
  username: string;
  profileUrl: string;
  httpStatus: number;
}): { success: true; profile: InstagramParsedProfile } | { success: false; error: ExtractionError } {
  const parsed = parseInstagramPublicProfilePage({
    ...input,
    workerVersion: INSTAGRAM_WORKER_VERSION,
    extractedAt: new Date().toISOString(),
  });

  if (!parsed.success) {
    return {
      success: false,
      error: mapPublicProfileErrorToExtractionError(parsed.error),
    };
  }

  const { metadata, rawSummary } = parsed.result;

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
        publicPhone: metadata.publicPhone,
        followers: metadata.followers,
        following: metadata.following,
        posts: metadata.posts,
        verified: metadata.verified,
        businessCategory: metadata.businessCategory,
      },
      rawJson: rawSummary,
    },
  };
}

export function buildMockInstagramProfile(
  username: string,
  profileUrl: string,
): InstagramParsedProfile {
  const mock = buildMockInstagramPublicProfile(username, profileUrl, INSTAGRAM_WORKER_VERSION);
  return {
    metadata: {
      platform: "instagram",
      username: mock.metadata.username,
      displayName: mock.metadata.displayName,
      bio: mock.metadata.bio,
      profileUrl: mock.metadata.profileUrl,
      profileImageUrl: mock.metadata.profileImageUrl,
      website: mock.metadata.website,
      publicEmail: mock.metadata.publicEmail,
      publicPhone: mock.metadata.publicPhone,
      followers: mock.metadata.followers,
      following: mock.metadata.following,
      posts: mock.metadata.posts,
      verified: mock.metadata.verified,
      businessCategory: mock.metadata.businessCategory,
    },
    rawJson: mock.rawSummary,
  };
}
