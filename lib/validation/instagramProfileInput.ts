import type {
  InstagramProfileBulkParseResult,
  InstagramProfileInput,
} from "@/lib/types/instagram-imports";

const INSTAGRAM_HOST_PATTERN = /(?:^|\.)instagram\.com/i;

const REJECTED_PATH_PREFIXES = new Set([
  "p",
  "reel",
  "reels",
  "stories",
  "explore",
  "tags",
  "tv",
  "direct",
  "accounts",
  "about",
  "legal",
  "developer",
]);

const REJECTED_PATH_PATTERNS = [
  /\/p\//i,
  /\/reel\//i,
  /\/reels\//i,
  /\/stories\//i,
  /\/explore\//i,
  /\/tags\//i,
  /\/tv\//i,
];

export interface NormalizedInstagramInput {
  username: string | null;
  profileUrl: string | null;
  error: string | null;
}

export function validateInstagramUsername(username: string): {
  valid: boolean;
  error?: string;
} {
  if (!username) {
    return { valid: false, error: "Username is required." };
  }

  if (username.length > 30) {
    return { valid: false, error: "Username exceeds 30 characters." };
  }

  if (!/^[a-zA-Z0-9._]+$/.test(username)) {
    return {
      valid: false,
      error: "Username may only contain letters, numbers, periods, and underscores.",
    };
  }

  if (username.startsWith(".") || username.endsWith(".")) {
    return {
      valid: false,
      error: "Username cannot start or end with a period.",
    };
  }

  if (username.includes("..")) {
    return {
      valid: false,
      error: "Username cannot contain consecutive periods.",
    };
  }

  return { valid: true };
}

function buildProfileUrl(username: string): string {
  return `https://www.instagram.com/${username}/`;
}

function parseInstagramUrl(input: string): NormalizedInstagramInput {
  for (const pattern of REJECTED_PATH_PATTERNS) {
    if (pattern.test(input)) {
      return {
        username: null,
        profileUrl: null,
        error: "Post, reel, story, explore, or tag URLs are not supported.",
      };
    }
  }

  let url: URL;

  try {
    url = input.startsWith("http") ? new URL(input) : new URL(`https://${input}`);
  } catch {
    return {
      username: null,
      profileUrl: null,
      error: "Invalid Instagram URL format.",
    };
  }

  if (!INSTAGRAM_HOST_PATTERN.test(url.hostname)) {
    return {
      username: null,
      profileUrl: null,
      error: "URL must point to instagram.com.",
    };
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);

  if (pathSegments.length === 0) {
    return {
      username: null,
      profileUrl: null,
      error: "No username found in Instagram URL.",
    };
  }

  const firstSegment = pathSegments[0].toLowerCase();

  if (REJECTED_PATH_PREFIXES.has(firstSegment)) {
    return {
      username: null,
      profileUrl: null,
      error: "Only public profile URLs are supported.",
    };
  }

  if (pathSegments.length > 1) {
    return {
      username: null,
      profileUrl: null,
      error: "Only direct profile URLs are supported.",
    };
  }

  const validation = validateInstagramUsername(pathSegments[0]);

  if (!validation.valid) {
    return {
      username: null,
      profileUrl: null,
      error: validation.error ?? "Invalid username.",
    };
  }

  const username = pathSegments[0].toLowerCase();

  return {
    username,
    profileUrl: buildProfileUrl(username),
    error: null,
  };
}

export function normalizeInstagramInput(input: string): NormalizedInstagramInput {
  const trimmed = input.trim();

  if (!trimmed) {
    return {
      username: null,
      profileUrl: null,
      error: "Empty value.",
    };
  }

  if (trimmed.startsWith("#")) {
    return {
      username: null,
      profileUrl: null,
      error: "Hashtags are not supported.",
    };
  }

  let value = trimmed;

  if (value.startsWith("@")) {
    value = value.slice(1).trim();
  }

  if (!value) {
    return {
      username: null,
      profileUrl: null,
      error: "Empty username.",
    };
  }

  if (INSTAGRAM_HOST_PATTERN.test(value) || value.startsWith("http")) {
    return parseInstagramUrl(value);
  }

  const validation = validateInstagramUsername(value);

  if (!validation.valid) {
    return {
      username: null,
      profileUrl: null,
      error: validation.error ?? "Invalid username.",
    };
  }

  const username = value.toLowerCase();

  return {
    username,
    profileUrl: buildProfileUrl(username),
    error: null,
  };
}

export function parseInstagramBulkInput(text: string): InstagramProfileBulkParseResult {
  const lines = text.split(/\r?\n/);
  const seenUsernames = new Map<string, string>();
  const rows: InstagramProfileInput[] = [];

  let validProfiles = 0;
  let duplicates = 0;
  let invalidRows = 0;

  lines.forEach((line, index) => {
    const originalInput = line;
    const trimmed = line.trim();

    if (!trimmed) {
      invalidRows += 1;
      rows.push({
        lineNumber: index + 1,
        originalInput,
        username: null,
        profileUrl: null,
        status: "invalid",
        error: "Empty line.",
        duplicateOf: null,
      });
      return;
    }

    const normalized = normalizeInstagramInput(trimmed);

    if (normalized.error || !normalized.username) {
      invalidRows += 1;
      rows.push({
        lineNumber: index + 1,
        originalInput,
        username: null,
        profileUrl: null,
        status: "invalid",
        error: normalized.error ?? "Invalid input.",
        duplicateOf: null,
      });
      return;
    }

    const firstOccurrence = seenUsernames.get(normalized.username);

    if (firstOccurrence) {
      duplicates += 1;
      rows.push({
        lineNumber: index + 1,
        originalInput,
        username: normalized.username,
        profileUrl: normalized.profileUrl,
        status: "duplicate",
        error: "Duplicate username in this batch.",
        duplicateOf: firstOccurrence,
      });
      return;
    }

    seenUsernames.set(normalized.username, originalInput);
    validProfiles += 1;

    rows.push({
      lineNumber: index + 1,
      originalInput,
      username: normalized.username,
      profileUrl: normalized.profileUrl,
      status: "valid",
      error: null,
      duplicateOf: null,
    });
  });

  return {
    rows,
    summary: {
      totalLines: lines.length,
      validProfiles,
      duplicates,
      invalidRows,
    },
  };
}
