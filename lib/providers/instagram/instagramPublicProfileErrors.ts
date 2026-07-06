import type { InstagramExtractorErrorCode } from "./instagramPublicProfileTypes";

export interface InstagramExtractorError {
  code: InstagramExtractorErrorCode;
  message: string;
  retryable: boolean;
}

const RETRYABLE_CODES = new Set<InstagramExtractorErrorCode>([
  "profile_unavailable",
  "parse_failed",
  "network_timeout",
  "rate_limited",
  "blocked",
  "unknown_error",
]);

export function createInstagramExtractorError(
  code: InstagramExtractorErrorCode,
  message: string,
  retryable?: boolean,
): InstagramExtractorError {
  return {
    code,
    message,
    retryable: retryable ?? RETRYABLE_CODES.has(code),
  };
}

export function getInstagramExtractorErrorLabel(code: InstagramExtractorErrorCode): string {
  if (code === "success") return "Success";
  return code
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function isRetryableExtractorError(code: InstagramExtractorErrorCode): boolean {
  return RETRYABLE_CODES.has(code);
}
