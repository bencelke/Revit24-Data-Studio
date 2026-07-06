import { mockRevit24ImportQueueStore } from "@/lib/mock-data/revit24ImportQueueStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
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
import {
  extractInstagramProfiles,
  getExtractorPageData,
  getExtractorSettingsData,
} from "@/lib/services/instagramPublicExtractorService";

export {
  extractInstagramProfiles,
  getExtractorPageData,
  getExtractorSettingsData,
} from "@/lib/services/instagramPublicExtractorService";

/** @deprecated Use extractInstagramProfiles */
export const extractSimpleInstagramProfiles = extractInstagramProfiles;

export async function getSimpleImportPageData(): Promise<SimpleImportPageData> {
  const page = await getExtractorPageData();
  return {
    firebaseConfigured: isFirebaseConfigured(),
    dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    extractionLive: page.extractionEnabled,
  };
}

export async function getSimpleSettingsData(): Promise<SimpleSettingsData> {
  const settings = await getExtractorSettingsData();
  return {
    firebaseConfigured: isFirebaseConfigured(),
    dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    extractionEnabled: settings.extractionEnabled,
    extractionDelayMs: settings.extractionDelayMs,
    extractionMaxRetries: settings.extractionMaxRetries,
  };
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

/** Next-phase upload — kept for API backward compatibility. */
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
