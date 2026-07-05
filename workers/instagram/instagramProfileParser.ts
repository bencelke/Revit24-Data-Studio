import type {
  ExtractionError,
  ExtractionErrorCode,
  ProfileMetadata,
} from "@/lib/types/profile-extraction";

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

const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/;
const PHONE_PATTERN = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}\b/;

export function createExtractionError(
  code: ExtractionErrorCode,
  message: string,
  retryable = false,
): ExtractionError {
  return { code, message, retryable };
}

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

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#x27;/g, "'");
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

function detectPrivateProfile(html: string): boolean {
  const markers = [
    "This Account is Private",
    '"is_private":true',
    '"isPrivate":true',
    "login_required",
    "Log in to Instagram",
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

export function parseInstagramPublicProfile(
  input: InstagramParseInput,
): { success: true; profile: InstagramParsedProfile } | { success: false; error: ExtractionError } {
  const { html, username, profileUrl, httpStatus } = input;

  if (detectNotFound(html, httpStatus)) {
    return {
      success: false,
      error: createExtractionError("PROFILE_NOT_FOUND", "Instagram profile not found.", false),
    };
  }

  if (detectPrivateProfile(html)) {
    return {
      success: false,
      error: createExtractionError(
        "PRIVATE_PROFILE",
        "Profile is private — only public metadata can be collected.",
        false,
      ),
    };
  }

  const ogTitle = extractMetaContent(html, "og:title", "property");
  const ogDescription = extractMetaContent(html, "og:description", "property");
  const ogImage = extractMetaContent(html, "og:image", "property");

  if (!ogTitle && !ogDescription && html.length < 500) {
    return {
      success: false,
      error: createExtractionError(
        "UNEXPECTED_HTML",
        "Unexpected HTML response — profile data not available.",
        true,
      ),
    };
  }

  const bio = ogDescription;
  const displayName = parseDisplayNameFromOgTitle(ogTitle, username);

  const followers = extractCount(html, [
    /"edge_followed_by":\{"count":(\d+)/,
    /"follower_count":(\d+)/,
    /"followers":(\d+)/,
  ]);
  const following = extractCount(html, [
    /"edge_follow":\{"count":(\d+)/,
    /"following_count":(\d+)/,
    /"following":(\d+)/,
  ]);
  const posts = extractCount(html, [
    /"edge_owner_to_timeline_media":\{"count":(\d+)/,
    /"media_count":(\d+)/,
    /"posts":(\d+)/,
  ]);

  const metadata: ProfileMetadata = {
    platform: "instagram",
    username,
    displayName,
    bio,
    profileUrl,
    profileImageUrl: ogImage,
    website: extractWebsite(html),
    publicEmail: extractPublicEmailFromBio(bio),
    publicPhone: extractPublicPhoneFromBio(bio),
    followers,
    following,
    posts,
    verified: extractVerified(html),
    businessCategory: extractBusinessCategory(html),
  };

  return {
    success: true,
    profile: {
      metadata,
      rawJson: {
        ogTitle,
        ogDescription,
        ogImage,
        followers,
        following,
        posts,
      },
    },
  };
}

export function buildMockInstagramProfile(
  username: string,
  profileUrl: string,
): InstagramParsedProfile {
  const displayName = username
    .split(/[._]/)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");

  const bio = `Public automotive community profile for @${username}. Contact: hello@${username}.example`;

  const metadata: ProfileMetadata = {
    platform: "instagram",
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
  };

  return {
    metadata,
    rawJson: { mock: true, username },
  };
}
