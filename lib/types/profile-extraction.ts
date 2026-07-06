export const EXTRACTION_ERROR_CODES = [
  "PROFILE_NOT_FOUND",
  "PRIVATE_PROFILE",
  "PROFILE_UNAVAILABLE",
  "NETWORK_FAILURE",
  "TIMEOUT",
  "UNEXPECTED_HTML",
  "PARSE_ERROR",
  "PARSE_FAILED",
  "INVALID_INPUT",
  "RATE_LIMITED",
  "BLOCKED",
  "UNKNOWN",
] as const;

export type ExtractionErrorCode = (typeof EXTRACTION_ERROR_CODES)[number];

export interface ExtractionError {
  code: ExtractionErrorCode;
  message: string;
  retryable: boolean;
}

export interface ProfileExtractionInput {
  profileUrl?: string | null;
  username?: string | null;
}

export interface ProfileMetadata {
  platform: string;
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
}

export interface ProfileExtractionResult {
  success: boolean;
  data: ProfileMetadata | null;
  error: ExtractionError | null;
  durationMs: number;
  workerVersion: string;
}

export interface ProfileExtractionProvider {
  readonly platform: string;
  readonly version: string;
  extractProfile(input: ProfileExtractionInput): Promise<ProfileExtractionResult>;
}

export function isRetryableError(error: ExtractionError | null): boolean {
  return error?.retryable ?? false;
}
