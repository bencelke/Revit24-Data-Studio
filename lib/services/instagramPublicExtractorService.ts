import {
  INSTAGRAM_PROVIDER_CONFIG,
  getInstagramExtractionDelayMs,
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";
import type {
  ExtractedInstagramProfile,
  ExtractorPageData,
  ExtractorSettingsData,
} from "@/lib/types/instagramExtraction";
import { defaultInstagramPublicProfileProvider } from "@/workers/instagram/instagramPublicProfileProvider";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
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
        username: input.username,
        profileUrl: input.profileUrl,
        profileImageUrl: null,
        displayName: null,
        bio: null,
        publicEmail: null,
        website: null,
        status: "failed",
        error: result.error?.message ?? "Extraction failed.",
        extractedAt: timestamp,
      };
    }

    return {
      id: `profile_${input.username}_${Date.now()}`,
      username: result.data.username,
      profileUrl: result.data.profileUrl,
      profileImageUrl: result.data.profileImageUrl,
      displayName: result.data.displayName,
      bio: result.data.bio,
      publicEmail: result.data.publicEmail,
      website: result.data.website,
      status: "completed",
      error: null,
      extractedAt: timestamp,
    };
  } catch (error) {
    return {
      id: `profile_${input.username}_${Date.now()}`,
      username: input.username,
      profileUrl: input.profileUrl,
      profileImageUrl: null,
      displayName: null,
      bio: null,
      publicEmail: null,
      website: null,
      status: "failed",
      error: error instanceof Error ? error.message : "Extraction failed.",
      extractedAt: timestamp,
    };
  }
}

export async function extractInstagramProfiles(
  profiles: { username: string; profileUrl: string }[],
): Promise<ExtractedInstagramProfile[]> {
  const results: ExtractedInstagramProfile[] = [];
  const delayMs = getInstagramExtractionDelayMs();

  for (let index = 0; index < profiles.length; index += 1) {
    if (index > 0 && !shouldUseInstagramMockExtraction() && delayMs > 0) {
      await sleep(delayMs);
    }
    results.push(await extractSingleProfile(profiles[index]));
  }

  return results;
}

export async function getExtractorPageData(): Promise<ExtractorPageData> {
  return {
    extractorMode: shouldUseInstagramMockExtraction() ? "mock" : "live",
    extractionEnabled: isInstagramExtractionEnabled(),
  };
}

export async function getExtractorSettingsData(): Promise<ExtractorSettingsData> {
  const mockMode = shouldUseInstagramMockExtraction();
  return {
    extractorMode: mockMode ? "mock" : "live",
    mockMode,
    extractionEnabled: isInstagramExtractionEnabled(),
    extractionDelayMs: INSTAGRAM_PROVIDER_CONFIG.delayMs,
    extractionMaxRetries: INSTAGRAM_PROVIDER_CONFIG.maxRetries,
  };
}
