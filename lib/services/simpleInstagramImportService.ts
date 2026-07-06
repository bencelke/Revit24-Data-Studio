import { mockRevit24ImportQueueStore } from "@/lib/mock-data/revit24ImportQueueStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  INSTAGRAM_PROVIDER_CONFIG,
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  createRevit24ImportQueueRecords,
  listRevit24ImportQueueUsernames,
} from "@/lib/repositories/revit24ImportQueueRepository";
import type {
  CreateRevit24ImportQueueInput,
  SimpleExtractedProfile,
  SimpleImportPageData,
  SimpleSettingsData,
  UploadToRevit24Result,
} from "@/lib/types/simpleInstagramImport";
import { defaultInstagramPublicProfileProvider } from "@/workers/instagram/instagramPublicProfileProvider";

function titleCaseUsername(username: string): string {
  return username
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMockProfile(username: string, profileUrl: string): SimpleExtractedProfile {
  const timestamp = new Date().toISOString();
  return {
    id: `profile_${username}_${Date.now()}`,
    username,
    profileUrl,
    displayName: titleCaseUsername(username),
    profileImageUrl: null,
    publicEmail: null,
    status: "mock",
    error: null,
    extractedAt: timestamp,
  };
}

async function extractSingleProfile(input: {
  username: string;
  profileUrl: string;
}): Promise<SimpleExtractedProfile> {
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
        displayName: null,
        profileImageUrl: null,
        publicEmail: null,
        status: "failed",
        error: result.error?.message ?? "Extraction failed.",
        extractedAt: timestamp,
      };
    }

    return {
      id: `profile_${input.username}_${Date.now()}`,
      username: result.data.username,
      profileUrl: result.data.profileUrl,
      displayName: result.data.displayName,
      profileImageUrl: result.data.profileImageUrl,
      publicEmail: result.data.publicEmail,
      status: "completed",
      error: null,
      extractedAt: timestamp,
    };
  } catch (error) {
    return {
      id: `profile_${input.username}_${Date.now()}`,
      username: input.username,
      profileUrl: input.profileUrl,
      displayName: null,
      profileImageUrl: null,
      publicEmail: null,
      status: "failed",
      error: error instanceof Error ? error.message : "Extraction failed.",
      extractedAt: timestamp,
    };
  }
}

export async function extractSimpleInstagramProfiles(
  profiles: { username: string; profileUrl: string }[],
): Promise<SimpleExtractedProfile[]> {
  const results: SimpleExtractedProfile[] = [];
  for (const profile of profiles) {
    results.push(await extractSingleProfile(profile));
  }
  return results;
}

function toQueueInput(row: SimpleExtractedProfile): CreateRevit24ImportQueueInput {
  const timestamp = new Date().toISOString();
  return {
    source: "instagram",
    username: row.username,
    profileUrl: row.profileUrl,
    displayName: row.displayName,
    profileImageUrl: row.profileImageUrl,
    publicEmail: row.publicEmail,
    status: "pending_review",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

async function loadExistingQueueUsernames(): Promise<Set<string>> {
  if (isFirestoreAvailable()) {
    try {
      const usernames = await listRevit24ImportQueueUsernames();
      return new Set(usernames.map((name) => name.toLowerCase()));
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return new Set(mockRevit24ImportQueueStore.listUsernames());
      }
      throw error;
    }
  }
  return new Set(mockRevit24ImportQueueStore.listUsernames());
}

export async function uploadToRevit24ImportQueue(
  rows: SimpleExtractedProfile[],
): Promise<UploadToRevit24Result> {
  const successful = rows.filter((row) => row.status === "completed" || row.status === "mock");

  if (successful.length === 0) {
    throw new Error("No successfully extracted profiles to upload.");
  }

  const existing = await loadExistingQueueUsernames();
  const duplicateUsernames: string[] = [];
  const toUpload: SimpleExtractedProfile[] = [];

  for (const row of successful) {
    const key = row.username.toLowerCase();
    if (existing.has(key)) {
      duplicateUsernames.push(row.username);
    } else {
      toUpload.push(row);
      existing.add(key);
    }
  }

  const failedCount = rows.filter((row) => row.status === "failed").length;

  if (toUpload.length === 0) {
    return {
      successCount: 0,
      failedCount,
      duplicateCount: duplicateUsernames.length,
      duplicateUsernames,
      dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    };
  }

  const inputs = toUpload.map(toQueueInput);

  if (isFirestoreAvailable()) {
    try {
      await createRevit24ImportQueueRecords(inputs);
      return {
        successCount: inputs.length,
        failedCount,
        duplicateCount: duplicateUsernames.length,
        duplicateUsernames,
        dataMode: "firestore",
      };
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockRevit24ImportQueueStore.createRecords(inputs);
        return {
          successCount: inputs.length,
          failedCount,
          duplicateCount: duplicateUsernames.length,
          duplicateUsernames,
          dataMode: "mock",
        };
      }
      throw error;
    }
  }

  mockRevit24ImportQueueStore.createRecords(inputs);
  return {
    successCount: inputs.length,
    failedCount,
    duplicateCount: duplicateUsernames.length,
    duplicateUsernames,
    dataMode: "mock",
  };
}

export async function getSimpleImportPageData(): Promise<SimpleImportPageData> {
  return {
    firebaseConfigured: isFirebaseConfigured(),
    dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    extractionLive: isInstagramExtractionEnabled(),
  };
}

export async function getSimpleSettingsData(): Promise<SimpleSettingsData> {
  return {
    firebaseConfigured: isFirebaseConfigured(),
    dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    extractionEnabled: isInstagramExtractionEnabled(),
    extractionDelayMs: INSTAGRAM_PROVIDER_CONFIG.delayMs,
    extractionMaxRetries: INSTAGRAM_PROVIDER_CONFIG.maxRetries,
  };
}
