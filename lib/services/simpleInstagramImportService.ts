import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  formatFirebaseStatusLabel,
  getFirebaseConnectionStatus,
  getFirebaseProjectId,
} from "@/lib/firebase/status";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { uploadToRevit24ImportQueue as uploadToQueue } from "@/lib/repositories/revit24ImportQueueRepository";
import type {
  SimpleExtractedProfile,
  SimpleImportPageData,
  SimpleSettingsData,
  UploadToRevit24ImportQueueResult,
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

export async function uploadToRevit24ImportQueue(
  rows: SimpleExtractedProfile[],
): Promise<UploadToRevit24ImportQueueResult> {
  return uploadToQueue(rows);
}

/** @deprecated Use UploadToRevit24ImportQueueResult */
export async function uploadToRevit24ImportQueueLegacy(
  rows: SimpleExtractedProfile[],
): Promise<UploadToRevit24Result> {
  const result = await uploadToQueue(rows);
  return {
    successCount: result.uploadedCount,
    failedCount: result.failedCount,
    duplicateCount: result.skippedDuplicateCount,
    duplicateUsernames: result.duplicateUsernames,
    dataMode: result.dataMode,
  };
}

export function getFirebaseSettingsSnapshot() {
  const status = getFirebaseConnectionStatus();
  return {
    firebaseConnected: status === "connected",
    firebaseStatus: formatFirebaseStatusLabel(status),
    firebaseProjectId: getFirebaseProjectId(),
    importQueueCollection: FIRESTORE_COLLECTIONS.revit24_import_queue,
    deployment: "Vercel",
  };
}
