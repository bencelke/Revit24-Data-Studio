import {
  extractBioFromMetadata,
  extractDisplayNameFromMetadata,
  extractEmailFromText,
  extractMetaContent,
  extractProfileImageFromHtml,
  extractWebsiteFromMetadata,
  buildMockProfileImageUrl,
  sanitizeInstagramText,
} from "@/lib/utils/instagramMetadata";
import type { InstagramPublicProfileData } from "./instagramPublicProfileTypes";
import {
  createInstagramExtractorError,
  normalizeExtractorErrorCode,
} from "./instagramPublicProfileErrors";
import type { InstagramExtractorError } from "./instagramPublicProfileErrors";

export interface InstagramPublicProfileParseInput {
  html: string;
  username: string;
  profileUrl: string;
  httpStatus: number;
  extractedAt: string;
}

function parseJsonBlock<T>(html: string, marker: string): T | null {
  const index = html.indexOf(marker);
  if (index < 0) return null;

  const start = html.indexOf("{", index);
  if (start < 0) return null;

  let depth = 0;
  for (let i = start; i < html.length; i += 1) {
    const char = html[i];
    if (char === "{") depth += 1;
    if (char === "}") {
      depth -= 1;
      if (depth === 0) {
        try {
          return JSON.parse(html.slice(start, i + 1)) as T;
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

function detectBlocked(html: string, httpStatus: number): boolean {
  if (httpStatus === 403 || httpStatus === 401) return true;
  const markers = [
    "Please wait a few minutes",
    "checkpoint_required",
    "feedback_required",
    "Login • Instagram",
    "login_required",
  ];
  return markers.some((marker) => html.includes(marker));
}

function detectRateLimited(html: string, httpStatus: number): boolean {
  if (httpStatus === 429) return true;
  return html.toLowerCase().includes("rate limit") || html.toLowerCase().includes("too many requests");
}

function detectPrivateProfile(html: string): boolean {
  const markers = [
    "This Account is Private",
    '"is_private":true',
    '"isPrivate":true',
  ];
  return markers.some((marker) => html.includes(marker));
}

function detectNotFound(html: string, httpStatus: number): boolean {
  if (httpStatus === 404) return true;
  const markers = ["Sorry, this page isn't available", "Page Not Found"];
  return markers.some((marker) => html.includes(marker));
}

interface InstagramSharedData {
  entry_data?: {
    ProfilePage?: Array<{
      graphql?: {
        user?: {
          biography?: string;
          full_name?: string;
        };
      };
    }>;
  };
}

function readSharedDataBio(html: string): string | null {
  const shared = parseJsonBlock<InstagramSharedData>(html, "window._sharedData");
  const biography = shared?.entry_data?.ProfilePage?.[0]?.graphql?.user?.biography;
  return typeof biography === "string" ? sanitizeInstagramText(biography) : null;
}

function hasStructuredMetadata(html: string): boolean {
  return Boolean(
    extractMetaContent(html, "og:title", "property") ||
      extractMetaContent(html, "og:description", "property") ||
      extractMetaContent(html, "twitter:title", "name") ||
      html.includes("window._sharedData") ||
      html.includes("application/ld+json"),
  );
}

export function parseInstagramPublicProfilePage(
  input: InstagramPublicProfileParseInput,
): { success: true; data: InstagramPublicProfileData } | { success: false; error: InstagramExtractorError } {
  const { html, username, profileUrl, httpStatus, extractedAt } = input;

  if (detectBlocked(html, httpStatus)) {
    return {
      success: false,
      error: createInstagramExtractorError(
        "instagram_blocked_request",
        "Instagram blocked or limited the public profile request.",
        { httpStatus, step: "detect_blocked" },
      ),
    };
  }

  if (detectRateLimited(html, httpStatus)) {
    return {
      success: false,
      error: createInstagramExtractorError("rate_limited", "Rate limited by Instagram.", {
        httpStatus,
        step: "detect_rate_limit",
      }),
    };
  }

  if (detectNotFound(html, httpStatus)) {
    return {
      success: false,
      error: createInstagramExtractorError("profile_not_found", "Instagram profile not found.", {
        httpStatus,
        step: "detect_not_found",
      }),
    };
  }

  if (detectPrivateProfile(html)) {
    return {
      success: false,
      error: createInstagramExtractorError(
        "profile_private",
        "Profile is private — only public metadata can be collected.",
        { httpStatus, step: "detect_private" },
      ),
    };
  }

  if (!hasStructuredMetadata(html) && html.length < 500) {
    return {
      success: false,
      error: createInstagramExtractorError(
        "profile_unavailable",
        "Profile page unavailable or returned empty content.",
        { httpStatus, step: "parse_metadata" },
      ),
    };
  }

  const bio =
    readSharedDataBio(html) ??
    extractBioFromMetadata(html) ??
    extractMetaContent(html, "og:description", "property");

  const displayName = extractDisplayNameFromMetadata(html, username);
  const profileImageUrl = extractProfileImageFromHtml(html);
  const website = extractWebsiteFromMetadata(html);
  const publicEmail = extractEmailFromText(bio);

  if (!displayName && !bio && !profileImageUrl) {
    return {
      success: false,
      error: createInstagramExtractorError(
        "parse_failed_no_metadata",
        "Could not find public profile metadata on the returned Instagram page.",
        { httpStatus, step: "parse_metadata" },
      ),
    };
  }

  return {
    success: true,
    data: {
      username,
      profileUrl,
      displayName,
      profileImageUrl,
      bio,
      website,
      publicEmail,
      extractedAt,
    },
  };
}

export function buildMockInstagramPublicProfile(
  username: string,
  profileUrl: string,
): InstagramPublicProfileData {
  const displayName = username
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const bio = `[Mock] Public profile preview for @${username}. Not real Instagram data.`;
  const extractedAt = new Date().toISOString();

  return {
    username,
    profileUrl,
    displayName,
    profileImageUrl: buildMockProfileImageUrl(username),
    bio,
    website: null,
    publicEmail: extractEmailFromText(bio),
    extractedAt,
  };
}

export { normalizeExtractorErrorCode };
