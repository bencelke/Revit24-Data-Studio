import type { ExtractionError, ExtractionErrorCode } from "@/lib/types/profile-extraction";

export const INSTAGRAM_PUBLIC_PROFILE_ERROR_CODES = [
  "profile_not_found",
  "profile_private",
  "profile_unavailable",
  "parse_failed",
  "network_timeout",
  "rate_limited",
  "blocked",
  "unknown_error",
] as const;

export type InstagramPublicProfileErrorCode =
  (typeof INSTAGRAM_PUBLIC_PROFILE_ERROR_CODES)[number];

export interface InstagramPublicProfileError {
  code: InstagramPublicProfileErrorCode;
  message: string;
  retryable: boolean;
}

export interface InstagramPublicProfileMetadata {
  username: string;
  displayName: string | null;
  bio: string | null;
  profileUrl: string;
  profileImageUrl: string | null;
  website: string | null;
  publicEmail: string | null;
  publicPhone: string | null;
  followers: number | null;
  following: number | null;
  posts: number | null;
  verified: boolean;
  businessCategory: string | null;
  extractedAt: string;
  workerVersion: string;
  status: "completed" | "failed" | "private" | "not_found";
}

export interface InstagramPublicProfileParseResult {
  metadata: InstagramPublicProfileMetadata;
  rawSummary: Record<string, unknown>;
}

export interface InstagramPublicProfileExtractionResult {
  success: boolean;
  data: InstagramPublicProfileMetadata | null;
  error: InstagramPublicProfileError | null;
  durationMs: number;
  workerVersion: string;
  attempts: number;
}

const ERROR_CODE_MAP: Record<InstagramPublicProfileErrorCode, ExtractionErrorCode> = {
  profile_not_found: "PROFILE_NOT_FOUND",
  profile_private: "PRIVATE_PROFILE",
  profile_unavailable: "PROFILE_UNAVAILABLE",
  parse_failed: "PARSE_FAILED",
  network_timeout: "TIMEOUT",
  rate_limited: "RATE_LIMITED",
  blocked: "BLOCKED",
  unknown_error: "UNKNOWN",
};

export function mapPublicProfileErrorToExtractionError(
  error: InstagramPublicProfileError,
): ExtractionError {
  return {
    code: ERROR_CODE_MAP[error.code],
    message: error.message,
    retryable: error.retryable,
  };
}

export function createPublicProfileError(
  code: InstagramPublicProfileErrorCode,
  message: string,
  retryable = false,
): InstagramPublicProfileError {
  return { code, message, retryable };
}

export function getPublicProfileErrorLabel(code: InstagramPublicProfileErrorCode): string {
  return code
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
