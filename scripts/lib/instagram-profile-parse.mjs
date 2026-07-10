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

export function validateInstagramUsername(username) {
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
    return { valid: false, error: "Username cannot start or end with a period." };
  }

  if (username.includes("..")) {
    return { valid: false, error: "Username cannot contain consecutive periods." };
  }

  return { valid: true };
}

function buildProfileUrl(username) {
  return `https://www.instagram.com/${username}/`;
}

function parseInstagramUrl(input) {
  for (const pattern of REJECTED_PATH_PATTERNS) {
    if (pattern.test(input)) {
      return {
        username: null,
        profileUrl: null,
        error: "Post, reel, story, explore, or tag URLs are not supported.",
      };
    }
  }

  let url;

  try {
    url = input.startsWith("http") ? new URL(input) : new URL(`https://${input}`);
  } catch {
    return { username: null, profileUrl: null, error: "Invalid Instagram URL format." };
  }

  if (!INSTAGRAM_HOST_PATTERN.test(url.hostname)) {
    return { username: null, profileUrl: null, error: "URL must point to instagram.com." };
  }

  const pathSegments = url.pathname.split("/").filter(Boolean);
  if (pathSegments.length === 0) {
    return { username: null, profileUrl: null, error: "No username found in Instagram URL." };
  }

  const firstSegment = pathSegments[0].toLowerCase();
  if (REJECTED_PATH_PREFIXES.has(firstSegment)) {
    return { username: null, profileUrl: null, error: "Only public profile URLs are supported." };
  }

  if (pathSegments.length > 1) {
    return { username: null, profileUrl: null, error: "Only direct profile URLs are supported." };
  }

  const validation = validateInstagramUsername(pathSegments[0]);
  if (!validation.valid) {
    return { username: null, profileUrl: null, error: validation.error ?? "Invalid username." };
  }

  const username = pathSegments[0].toLowerCase();
  return { username, profileUrl: buildProfileUrl(username), error: null };
}

export function normalizeInstagramInput(input) {
  const trimmed = input.trim();
  if (!trimmed) {
    return { username: null, profileUrl: null, error: "Empty value." };
  }

  if (trimmed.startsWith("#")) {
    return { username: null, profileUrl: null, error: "Hashtags are not supported." };
  }

  let value = trimmed;
  if (value.startsWith("@")) {
    value = value.slice(1).trim();
  }

  if (!value) {
    return { username: null, profileUrl: null, error: "Empty username." };
  }

  if (INSTAGRAM_HOST_PATTERN.test(value) || value.startsWith("http")) {
    return parseInstagramUrl(value);
  }

  const validation = validateInstagramUsername(value);
  if (!validation.valid) {
    return { username: null, profileUrl: null, error: validation.error ?? "Invalid username." };
  }

  const username = value.toLowerCase();
  return { username, profileUrl: buildProfileUrl(username), error: null };
}

export function parseInstagramProfileInputs(inputs) {
  const seenUsernames = new Set();
  const profiles = [];
  let skipped = 0;

  for (const rawInput of inputs) {
    const normalized = normalizeInstagramInput(rawInput);
    if (normalized.error || !normalized.username) {
      skipped += 1;
      continue;
    }

    if (seenUsernames.has(normalized.username)) {
      skipped += 1;
      continue;
    }

    seenUsernames.add(normalized.username);
    profiles.push({
      username: normalized.username,
      profileUrl: normalized.profileUrl,
    });
  }

  return { profiles, skipped };
}

export function buildInstagramQueueDocumentId(username) {
  return `instagram-profile-${username.toLowerCase()}`;
}

export function buildQueueRecord(profile) {
  const username = profile.username.toLowerCase();
  const timestamp = new Date().toISOString();

  return {
    id: buildInstagramQueueDocumentId(username),
    source: "revit24-data-studio",
    sourcePlatform: "instagram",
    username,
    profileUrl: profile.profileUrl,
    status: "queued",
    createdAt: timestamp,
    updatedAt: timestamp,
    startedAt: "",
    completedAt: "",
    attempts: 0,
    errorCode: "",
    errorMessage: "",
  };
}
