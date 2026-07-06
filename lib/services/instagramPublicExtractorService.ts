import {
  INSTAGRAM_EXTRACTOR_CONFIG,
  getInstagramExtractionDelayMs,
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramExtractor";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { instagramPublicProfileProvider } from "@/lib/providers/instagram";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  upsertExtractionResult,
  listExtractionResults,
  deleteExtractionResult,
  clearExtractionResults,
} from "@/lib/repositories/instagramExtractionStorage";
import {
  findByUsername as findFirestoreByUsername,
} from "@/lib/repositories/instagramExtractionsRepository";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import type {
  CreateInstagramExtractionInput,
  ExtractedInstagramProfile,
  ExtractionStatus,
  ExtractorPageData,
  ExtractorSettingsData,
  InstagramExtractionRunSummary,
  StorageMode,
} from "@/lib/types/instagramExtraction";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function getStorageMode(): StorageMode {
  return isFirestoreAvailable() ? "live" : "mock";
}

function mapProviderStatus(success: boolean, mock: boolean): ExtractionStatus {
  if (mock) return "mock";
  if (success) return "completed";
  return "failed";
}

function toCreateInput(params: {
  username: string;
  profileUrl: string;
  profileImageUrl: string | null;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  status: ExtractionStatus;
  error: string | null;
  extractedAt: string;
}): CreateInstagramExtractionInput {
  const timestamp = new Date().toISOString();
  return {
    source: "instagram",
    username: params.username.toLowerCase(),
    profileUrl: params.profileUrl,
    profileImageUrl: params.profileImageUrl,
    displayName: params.displayName,
    bio: params.bio,
    website: params.website,
    publicEmail: params.publicEmail,
    status: params.status,
    error: params.error,
    extractedAt: params.extractedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function extractAndUpsertSingleProfile(input: {
  username: string;
  profileUrl: string;
}): Promise<{ record: ExtractedInstagramProfile; updated: boolean }> {
  const rawInput = input.profileUrl || input.username;
  const providerResult = await instagramPublicProfileProvider.extractProfile(rawInput);
  const extractedAt = providerResult.data?.extractedAt ?? new Date().toISOString();
  const status = mapProviderStatus(providerResult.success, providerResult.mock);

  const createInput = toCreateInput({
    username: providerResult.data?.username ?? input.username.toLowerCase(),
    profileUrl: providerResult.data?.profileUrl ?? input.profileUrl,
    profileImageUrl: providerResult.data?.profileImageUrl ?? null,
    displayName: providerResult.data?.displayName ?? null,
    bio: providerResult.data?.bio ?? null,
    website: providerResult.data?.website ?? null,
    publicEmail: providerResult.data?.publicEmail ?? null,
    status,
    error: providerResult.success ? null : providerResult.error,
    extractedAt,
  });

  const existing = isFirestoreAvailable()
    ? await findFirestoreByUsername(createInput.username)
    : null;
  if (existing) {
    createInput.createdAt = existing.createdAt;
  }

  const { record, updated } = await upsertExtractionResult(createInput);
  return { record, updated };
}

export async function runInstagramExtraction(
  profiles: { username: string; profileUrl: string }[],
): Promise<{ results: ExtractedInstagramProfile[]; summary: InstagramExtractionRunSummary }> {
  const storageMode = getStorageMode();
  const results: ExtractedInstagramProfile[] = [];
  let succeeded = 0;
  let failed = 0;
  let saved = 0;
  let updated = 0;
  const delayMs = getInstagramExtractionDelayMs();

  for (let index = 0; index < profiles.length; index += 1) {
    if (index > 0 && delayMs > 0) {
      await sleep(delayMs);
    }

    const { record, updated: wasUpdated } = await extractAndUpsertSingleProfile(profiles[index]);
    results.push(record);

    if (record.status === "completed" || record.status === "mock") {
      succeeded += 1;
    } else {
      failed += 1;
    }

    if (wasUpdated) {
      updated += 1;
    } else {
      saved += 1;
    }
  }

  return {
    results,
    summary: {
      total: profiles.length,
      succeeded,
      failed,
      saved,
      updated,
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
    extractionDelayMs: INSTAGRAM_EXTRACTOR_CONFIG.delayMs,
  };
}

export async function getExtractorSettingsData(): Promise<ExtractorSettingsData> {
  const firebaseConnected = isFirebaseConfigured();
  const storageMode = getStorageMode();
  const extractionLive = isInstagramExtractionEnabled();

  return {
    firebaseConnected,
    firebaseStatus: firebaseConnected ? "Connected" : "Not Connected",
    storageMode,
    mode: extractionLive ? "Live" : "Mock",
    extractionEnabled: extractionLive,
    extractionDelayMs: INSTAGRAM_EXTRACTOR_CONFIG.delayMs,
    extractionMaxRetries: INSTAGRAM_EXTRACTOR_CONFIG.maxRetries,
  };
}
