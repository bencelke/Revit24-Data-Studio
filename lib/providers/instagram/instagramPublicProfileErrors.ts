import type { InstagramExtractorErrorCode } from "./instagramPublicProfileTypes";

export interface InstagramExtractorError {
  code: InstagramExtractorErrorCode;
  message: string;
  retryable: boolean;
  httpStatus: number | null;
  step: string | null;
}

const RETRYABLE_CODES = new Set<InstagramExtractorErrorCode>([
  "profile_unavailable",
  "fetch_failed",
  "network_timeout",
  "rate_limited",
  "instagram_blocked_request",
  "blocked",
  "server_error",
  "unknown_error",
]);

export function createInstagramExtractorError(
  code: InstagramExtractorErrorCode,
  message: string,
  options?: {
    retryable?: boolean;
    httpStatus?: number | null;
    step?: string | null;
  },
): InstagramExtractorError {
  return {
    code,
    message,
    retryable: options?.retryable ?? RETRYABLE_CODES.has(code),
    httpStatus: options?.httpStatus ?? null,
    step: options?.step ?? null,
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

export function normalizeExtractorErrorCode(
  code: InstagramExtractorErrorCode,
): InstagramExtractorErrorCode {
  if (code === "blocked") return "instagram_blocked_request";
  if (code === "parse_failed") return "parse_failed_no_metadata";
  return code;
}
