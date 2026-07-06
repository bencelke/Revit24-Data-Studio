import type {
  InstagramPublicProfileError,
  InstagramPublicProfileMetadata,
  InstagramPublicProfileParseResult,
} from "./instagramPublicProfileTypes";
import { createPublicProfileError } from "./instagramPublicProfileTypes";

export interface InstagramPublicProfileParseInput {
  html: string;
  username: string;
  profileUrl: string;
  httpStatus: number;
  workerVersion: string;
  extractedAt: string;
}

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_PATTERN = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/;

export function extractPublicEmailFromBio(bio: string | null): string | null {
  if (!bio) return null;
  const match = bio.match(EMAIL_PATTERN);
  return match?.[0] ?? null;
}

export function extractPublicPhoneFromBio(bio: string | null): string | null {
  if (!bio) return null;
  const match = bio.match(PHONE_PATTERN);
  if (!match) return null;
  const digits = match[0].replace(/\D/g, "");
  return digits.length >= 7 ? match[0].trim() : null;
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'");
}

function extractMetaContent(html: string, key: string, attr: "property" | "name"): string | null {
  const patterns = [
    new RegExp(`<meta\\s+${attr}=["']${key}["']\\s+content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta\\s+content=["']([^"']*)["']\\s+${attr}=["']${key}["']`, "i"),
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) return decodeHtmlEntities(match[1]);
  }

  return null;
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

function extractLdJsonPerson(html: string): Record<string, unknown> | null {
  const matches = html.matchAll(
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
  );

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1] ?? "") as Record<string, unknown>;
      const type = String(parsed["@type"] ?? "");
      if (type.toLowerCase().includes("person") || type.toLowerCase().includes("profilepage")) {
        return parsed;
      }
    } catch {
      // continue
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
  ];
  return markers.some((marker) => html.includes(marker));
}

function detectRateLimited(html: string, httpStatus: number): boolean {
  if (httpStatus === 429) return true;
  return html.includes("rate limit") || html.includes("too many requests");
}

function detectPrivateProfile(html: string): boolean {
  const markers = [
    "This Account is Private",
    '"is_private":true',
    '"isPrivate":true',
    "login_required",
  ];
  return markers.some((marker) => html.includes(marker));
}

function detectNotFound(html: string, httpStatus: number): boolean {
  if (httpStatus === 404) return true;
  const markers = [
    "Sorry, this page isn't available",
    "Page Not Found",
    '"username":null',
  ];
  return markers.some((marker) => html.includes(marker));
}

function parseDisplayNameFromOgTitle(ogTitle: string | null, username: string): string | null {
  if (!ogTitle) return null;

  const parenMatch = ogTitle.match(/^(.+?)\s*\(@/);
  if (parenMatch?.[1]) return parenMatch[1].trim();

  const pipeMatch = ogTitle.match(/^(.+?)\s*[•|·|-]/);
  if (pipeMatch?.[1]) return pipeMatch[1].trim();

  if (ogTitle.toLowerCase().includes(username.toLowerCase())) {
    return ogTitle.replace(/@?\w+/g, "").replace(/[•|·|-].*/, "").trim() || null;
  }

  return ogTitle.trim() || null;
}

function extractCount(html: string, patterns: RegExp[]): number | null {
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = parseInt(match[1].replace(/,/g, ""), 10);
      if (!Number.isNaN(value)) return value;
    }
  }
  return null;
}

function extractWebsite(html: string): string | null {
  const externalLink = html.match(/"external_url":"([^"]+)"/);
  if (externalLink?.[1]) {
    return decodeHtmlEntities(externalLink[1].replace(/\\u0026/g, "&"));
  }
  return null;
}

function extractVerified(html: string): boolean {
  return html.includes('"is_verified":true') || html.includes('"isVerified":true');
}

function extractBusinessCategory(html: string): string | null {
  const match =
    html.match(/"category_name":"([^"]+)"/) ??
    html.match(/"business_category_name":"([^"]+)"/);
  return match?.[1] ? decodeHtmlEntities(match[1]) : null;
}

interface InstagramSharedData {
  entry_data?: {
    ProfilePage?: Array<{
      graphql?: {
        user?: Record<string, unknown>;
      };
    }>;
  };
}

function readSharedDataUser(html: string): Record<string, unknown> | null {
  const shared = parseJsonBlock<InstagramSharedData>(html, "window._sharedData");
  const user = shared?.entry_data?.ProfilePage?.[0]?.graphql?.user;
  return user ?? null;
}

export function parseInstagramPublicProfilePage(
  input: InstagramPublicProfileParseInput,
):
  | { success: true; result: InstagramPublicProfileParseResult }
  | { success: false; error: InstagramPublicProfileError } {
  const { html, username, profileUrl, httpStatus, workerVersion, extractedAt } = input;

  if (detectBlocked(html, httpStatus)) {
    return {
      success: false,
      error: createPublicProfileError("blocked", "Instagram blocked the request.", true),
    };
  }

  if (detectRateLimited(html, httpStatus)) {
    return {
      success: false,
      error: createPublicProfileError("rate_limited", "Rate limited by Instagram.", true),
    };
  }

  if (detectNotFound(html, httpStatus)) {
    return {
      success: false,
      error: createPublicProfileError("profile_not_found", "Instagram profile not found.", false),
    };
  }

  if (detectPrivateProfile(html)) {
    return {
      success: false,
      error: createPublicProfileError(
        "profile_private",
        "Profile is private — only public metadata can be collected.",
        false,
      ),
    };
  }

  const ogTitle = extractMetaContent(html, "og:title", "property");
  const ogDescription = extractMetaContent(html, "og:description", "property");
  const ogImage = extractMetaContent(html, "og:image", "property");

  const sharedUser = readSharedDataUser(html);
  const ldJson = extractLdJsonPerson(html);

  if (!ogTitle && !ogDescription && !sharedUser && html.length < 500) {
    return {
      success: false,
      error: createPublicProfileError(
        "profile_unavailable",
        "Profile page unavailable or returned empty content.",
        true,
      ),
    };
  }

  const bio =
    (typeof sharedUser?.biography === "string" ? sharedUser.biography : null) ??
    ogDescription ??
    (typeof ldJson?.description === "string" ? ldJson.description : null);

  const displayName =
    (typeof sharedUser?.full_name === "string" ? sharedUser.full_name : null) ??
    parseDisplayNameFromOgTitle(ogTitle, username) ??
    (typeof ldJson?.name === "string" ? ldJson.name : null);

  const profileImageUrl =
    (typeof sharedUser?.profile_pic_url_hd === "string" ? sharedUser.profile_pic_url_hd : null) ??
    (typeof sharedUser?.profile_pic_url === "string" ? sharedUser.profile_pic_url : null) ??
    ogImage ??
    (typeof ldJson?.image === "string" ? ldJson.image : null);

  const followers =
    extractCount(html, [
      /"edge_followed_by":\{"count":(\d+)/,
      /"follower_count":(\d+)/,
    ]) ??
    (typeof sharedUser?.edge_followed_by === "object" &&
    sharedUser.edge_followed_by &&
    typeof (sharedUser.edge_followed_by as { count?: number }).count === "number"
      ? (sharedUser.edge_followed_by as { count: number }).count
      : null);

  const following =
    extractCount(html, [
      /"edge_follow":\{"count":(\d+)/,
      /"following_count":(\d+)/,
    ]) ??
    (typeof sharedUser?.edge_follow === "object" &&
    sharedUser.edge_follow &&
    typeof (sharedUser.edge_follow as { count?: number }).count === "number"
      ? (sharedUser.edge_follow as { count: number }).count
      : null);

  const posts =
    extractCount(html, [
      /"edge_owner_to_timeline_media":\{"count":(\d+)/,
      /"media_count":(\d+)/,
    ]) ??
    (typeof sharedUser?.edge_owner_to_timeline_media === "object" &&
    sharedUser.edge_owner_to_timeline_media &&
    typeof (sharedUser.edge_owner_to_timeline_media as { count?: number }).count === "number"
      ? (sharedUser.edge_owner_to_timeline_media as { count: number }).count
      : null);

  if (!displayName && !bio && !profileImageUrl) {
    return {
      success: false,
      error: createPublicProfileError(
        "parse_failed",
        "Could not parse public profile metadata from the page.",
        true,
      ),
    };
  }

  const metadata: InstagramPublicProfileMetadata = {
    username,
    displayName,
    bio,
    profileUrl,
    profileImageUrl,
    website: extractWebsite(html),
    publicEmail: extractPublicEmailFromBio(bio),
    publicPhone: extractPublicPhoneFromBio(bio),
    followers,
    following,
    posts,
    verified: extractVerified(html),
    businessCategory: extractBusinessCategory(html),
    extractedAt,
    workerVersion,
    status: "completed",
  };

  return {
    success: true,
    result: {
      metadata,
      rawSummary: {
        ogTitle,
        ogDescription,
        ogImage,
        followers,
        following,
        posts,
        hasSharedData: sharedUser != null,
        hasLdJson: ldJson != null,
      },
    },
  };
}

export function buildMockInstagramPublicProfile(
  username: string,
  profileUrl: string,
  workerVersion: string,
): InstagramPublicProfileParseResult {
  const displayName = username
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const bio = `Public automotive community profile for @${username}. Contact: hello@${username}.example`;
  const extractedAt = new Date().toISOString();

  const metadata: InstagramPublicProfileMetadata = {
    username,
    displayName,
    bio,
    profileUrl,
    profileImageUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=ff5a1f&color=fff`,
    website: `https://${username}.example`,
    publicEmail: extractPublicEmailFromBio(bio),
    publicPhone: null,
    followers: 12_400,
    following: 842,
    posts: 156,
    verified: false,
    businessCategory: "Automotive Community",
    extractedAt,
    workerVersion,
    status: "completed",
  };

  return {
    metadata,
    rawSummary: { mock: true, username },
  };
}
