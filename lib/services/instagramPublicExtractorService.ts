import {
  INSTAGRAM_PROVIDER_CONFIG,
  getInstagramExtractionDelayMs,
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  createExtractionResultsBatch,
  findByUsername,
  listExtractionResults,
  deleteExtractionResult,
  clearExtractionResults,
} from "@/lib/repositories/instagramExtractionsRepository";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import type {
  CreateInstagramExtractionInput,
  ExtractedInstagramProfile,
  ExtractorPageData,
  ExtractorSettingsData,
  InstagramExtractionRunSummary,
  StorageMode,
} from "@/lib/types/instagramExtraction";
import { defaultInstagramPublicProfileProvider } from "@/workers/instagram/instagramPublicProfileProvider";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStorageMode(): StorageMode {
  return isFirestoreAvailable() ? "live" : "mock";
}

function titleCaseUsername(username: string): string {
  return username
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMockProfile(username: string, profileUrl: string): ExtractedInstagramProfile {
  const timestamp = new Date().toISOString();
  return {
    id: `profile_${username}_${Date.now()}`,
    source: "instagram",
    username,
    profileUrl,
    profileImageUrl: null,
    displayName: titleCaseUsername(username),
    bio: `Mock public bio for @${username}`,
    publicEmail: null,
    website: null,
    status: "mock",
    error: null,
    extractedAt: timestamp,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

function toCreateInput(profile: Omit<ExtractedInstagramProfile, "id">): CreateInstagramExtractionInput {
  const timestamp = new Date().toISOString();
  return {
    source: "instagram",
    username: profile.username.toLowerCase(),
    profileUrl: profile.profileUrl,
    profileImageUrl: profile.profileImageUrl,
    displayName: profile.displayName,
    bio: profile.bio,
    website: profile.website,
    publicEmail: profile.publicEmail,
    status: profile.status,
    error: profile.error,
    extractedAt: profile.extractedAt,
    createdAt: profile.createdAt ?? timestamp,
    updatedAt: profile.updatedAt ?? timestamp,
  };
}

async function extractSingleProfile(input: {
  username: string;
  profileUrl: string;
}): Promise<ExtractedInstagramProfile> {
  const timestamp = new Date().toISOString();

  if (shouldUseInstagramMockExtraction()) {
    return buildMockProfile(input.username, input.profileUrl);
  }

  try {
    const result = await defaultInstagramPublicProfileProvider.extractProfile({
      username: input.username,
      profileUrl: input.profileUrl,
    });

    if (!result.success || !result.data) {
      return {
        id: `profile_${input.username}_${Date.now()}`,
        source: "instagram",
        username: input.username.toLowerCase(),
        profileUrl: input.profileUrl,
        profileImageUrl: null,
        displayName: null,
        bio: null,
        publicEmail: null,
        website: null,
        status: "failed",
        error: result.error?.message ?? "Extraction failed.",
        extractedAt: timestamp,
        createdAt: timestamp,
        updatedAt: timestamp,
      };
    }

    return {
      id: `profile_${input.username}_${Date.now()}`,
      source: "instagram",
      username: result.data.username.toLowerCase(),
      profileUrl: result.data.profileUrl,
      profileImageUrl: result.data.profileImageUrl,
      displayName: result.data.displayName,
      bio: result.data.bio,
      publicEmail: result.data.publicEmail,
      website: result.data.website,
      status: "completed",
      error: null,
      extractedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  } catch (error) {
    return {
      id: `profile_${input.username}_${Date.now()}`,
      source: "instagram",
      username: input.username.toLowerCase(),
      profileUrl: input.profileUrl,
      profileImageUrl: null,
      displayName: null,
      bio: null,
      publicEmail: null,
      website: null,
      status: "failed",
      error: error instanceof Error ? error.message : "Extraction failed.",
      extractedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };
  }
}

export async function runInstagramExtraction(
  profiles: { username: string; profileUrl: string }[],
): Promise<{ results: ExtractedInstagramProfile[]; summary: InstagramExtractionRunSummary }> {
  const storageMode = getStorageMode();
  const extracted: ExtractedInstagramProfile[] = [];
  const toSave: CreateInstagramExtractionInput[] = [];
  const duplicateUsernames: string[] = [];
  const knownUsernames = new Set<string>();

  const existing = await listExtractionResults();
  for (const record of existing) {
    knownUsernames.add(record.username.toLowerCase());
  }

  const delayMs = getInstagramExtractionDelayMs();

  for (let index = 0; index < profiles.length; index += 1) {
    if (index > 0 && !shouldUseInstagramMockExtraction() && delayMs > 0) {
      await sleep(delayMs);
    }

    const profile = profiles[index];
    const result = await extractSingleProfile(profile);
    extracted.push(result);

    const usernameKey = result.username.toLowerCase();
    if (knownUsernames.has(usernameKey)) {
      duplicateUsernames.push(result.username);
      continue;
    }

    knownUsernames.add(usernameKey);
    const { id: omittedId, ...rest } = result;
    void omittedId;
    toSave.push(toCreateInput(rest));
  }

  const saved = await createExtractionResultsBatch(toSave);
  const failed = extracted.filter((row) => row.status === "failed").length;

  return {
    results: saved,
    summary: {
      total: profiles.length,
      extracted: extracted.length,
      saved: saved.length,
      duplicateSkipped: duplicateUsernames.length,
      failed,
      duplicateUsernames,
      storageMode,
    },
  };
}

/** @deprecated Use runInstagramExtraction */
export async function extractInstagramProfiles(
  profiles: { username: string; profileUrl: string }[],
): Promise<ExtractedInstagramProfile[]> {
  const { results } = await runInstagramExtraction(profiles);
  return results;
}

export async function runInstagramExtractionFromText(
  text: string,
): Promise<{ results: ExtractedInstagramProfile[]; summary: InstagramExtractionRunSummary }> {
  const parsed = parseInstagramInput(text);
  const profiles = parsed.rows
    .filter((row) => row.validationStatus === "valid" && row.username && row.profileUrl)
    .map((row) => ({
      username: row.username as string,
      profileUrl: row.profileUrl as string,
    }));

  if (profiles.length === 0) {
    throw new Error("No valid profiles to extract.");
  }

  return runInstagramExtraction(profiles);
}

export {
  listExtractionResults,
  findByUsername,
  deleteExtractionResult,
  clearExtractionResults,
};

export async function getExtractorPageData(): Promise<ExtractorPageData> {
  const firebaseConnected = isFirebaseConfigured();
  return {
    firebaseConnected,
    storageMode: getStorageMode(),
    extractorMode: shouldUseInstagramMockExtraction() ? "mock" : "live",
    extractionEnabled: isInstagramExtractionEnabled(),
  };
}

export async function getExtractorSettingsData(): Promise<ExtractorSettingsData> {
  const firebaseConnected = isFirebaseConfigured();
  const storageMode = getStorageMode();

  return {
    firebaseConnected,
    firebaseStatus: firebaseConnected ? "Connected" : "Not Connected",
    storageMode,
    mode: storageMode === "live" ? "Live" : "Mock",
    extractionEnabled: isInstagramExtractionEnabled(),
    extractionDelayMs: INSTAGRAM_PROVIDER_CONFIG.delayMs,
    extractionMaxRetries: INSTAGRAM_PROVIDER_CONFIG.maxRetries,
  };
}
