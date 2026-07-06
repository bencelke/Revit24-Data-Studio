export const INSTAGRAM_EXTRACTOR_ERROR_CODES = [
  "success",
  "invalid_input",
  "profile_not_found",
  "profile_private",
  "profile_unavailable",
  "parse_failed",
  "network_timeout",
  "rate_limited",
  "blocked",
  "disabled",
  "unknown_error",
] as const;

export type InstagramExtractorErrorCode = (typeof INSTAGRAM_EXTRACTOR_ERROR_CODES)[number];

export interface InstagramPublicProfileData {
  username: string;
  profileUrl: string;
  displayName: string | null;
  profileImageUrl: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  extractedAt: string;
}

export interface InstagramExtractionResult {
  success: boolean;
  data: InstagramPublicProfileData | null;
  errorCode: InstagramExtractorErrorCode;
  error: string | null;
  durationMs: number;
  mock: boolean;
}

export interface InstagramPublicProfileProvider {
  extractProfile(input: string): Promise<InstagramExtractionResult>;
}

export const INSTAGRAM_EXTRACTOR_VERSION = "1.0.0-public";
