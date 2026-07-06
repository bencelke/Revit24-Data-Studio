import {
  INSTAGRAM_EXTRACTOR_CONFIG,
  getInstagramExtractionDelayMs,
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramExtractor";
import {
  getInstagramWorkerDelayMs,
  getInstagramWorkerMaxRetries,
} from "@/lib/config/instagramWorker";
import { isFirebaseConfigured, FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseDiagnostics } from "@/lib/firebase/status";
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
import { listQueueItems } from "@/lib/repositories/instagramExtractionQueueRepository";
import { normalizeInstagramInput } from "@/lib/validation/instagramProfileInput";
import { normalizeExtractorErrorCode } from "@/lib/providers/instagram/instagramPublicProfileErrors";
import type { InstagramExtractionResult } from "@/lib/providers/instagram/instagramPublicProfileTypes";
import { parseInstagramInput } from "@/lib/validation/instagramInput";
import { buildMockProfileImageUrl } from "@/lib/utils/instagramMetadata";
import { detectInstagramEntityType } from "@/lib/utils/instagramEntityType";
import type {
  CreateInstagramExtractionInput,
  ExtractedInstagramProfile,
  ExtractionStatus,
  ExtractorPageData,
  ExtractorSettingsData,
  InstagramEntityType,
  InstagramExtractApiResponse,
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
  entityType: InstagramEntityType;
  status: ExtractionStatus;
  error: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  extractedAt: string;
}): CreateInstagramExtractionInput {
  const timestamp = new Date().toISOString();
  return {
    source: "instagram",
    entityType: params.entityType,
    username: params.username.toLowerCase(),
    profileUrl: params.profileUrl,
    profileImageUrl: params.profileImageUrl,
    displayName: params.displayName,
    bio: params.bio,
    website: params.website,
    publicEmail: params.publicEmail,
    status: params.status,
    error: params.error,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage ?? params.error,
    extractedAt: params.extractedAt,
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function extractAndUpsertSingleProfile(input: {
  username: string;
  profileUrl: string;
}): Promise<{
  record: ExtractedInstagramProfile;
  updated: boolean;
  providerResult: InstagramExtractionResult;
}> {
  const rawInput = input.profileUrl || input.username;
  const providerResult = await instagramPublicProfileProvider.extractProfile(rawInput);
  const extractedAt = providerResult.data?.extractedAt ?? new Date().toISOString();
  const status = mapProviderStatus(providerResult.success, providerResult.mock);

  const errorCode = providerResult.success
    ? null
    : normalizeExtractorErrorCode(providerResult.errorCode);

  const createInput = toCreateInput({
    username: providerResult.data?.username ?? input.username.toLowerCase(),
    profileUrl: providerResult.data?.profileUrl ?? input.profileUrl,
    profileImageUrl:
      providerResult.data?.profileImageUrl ??
      (providerResult.mock ? buildMockProfileImageUrl(input.username) : null),
    displayName: providerResult.data?.displayName ?? null,
    bio: providerResult.data?.bio ?? null,
    website: providerResult.data?.website ?? null,
    publicEmail: providerResult.data?.publicEmail ?? null,
    entityType: detectInstagramEntityType({
      username: providerResult.data?.username ?? input.username,
      displayName: providerResult.data?.displayName ?? null,
      bio: providerResult.data?.bio ?? null,
    }),
    status,
    error: providerResult.success ? null : providerResult.error,
    errorCode,
    errorMessage: providerResult.success ? null : providerResult.error,
    extractedAt,
  });

  const existing = isFirestoreAvailable()
    ? await findFirestoreByUsername(createInput.username)
    : null;
  if (existing) {
    createInput.createdAt = existing.createdAt;
  }

  const { record, updated } = await upsertExtractionResult(createInput);
  return { record, updated, providerResult };
}

export async function extractProfileForApi(profileInput: string): Promise<InstagramExtractApiResponse> {
  const normalized = normalizeInstagramInput(profileInput.trim());

  if (!normalized.username || !normalized.profileUrl || normalized.error) {
    const timestamp = new Date().toISOString();
    const failedRecord: ExtractedInstagramProfile = {
      id: `invalid_${Date.now()}`,
      source: "instagram",
      entityType: detectInstagramEntityType({
        username: profileInput.replace(/^@/, "").toLowerCase(),
      }),
      username: profileInput.replace(/^@/, "").toLowerCase(),
      profileUrl: normalized.profileUrl ?? "",
      profileImageUrl: null,
      displayName: null,
      bio: null,
      website: null,
      publicEmail: null,
      status: "failed",
      error: normalized.error ?? "Invalid Instagram profile input.",
      errorCode: "invalid_input",
      errorMessage: normalized.error ?? "Invalid Instagram profile input.",
      extractedAt: timestamp,
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    return {
      ok: false,
      record: failedRecord,
      error: {
        code: "invalid_input",
        message: normalized.error ?? "Invalid Instagram profile input.",
        httpStatus: null,
        step: "normalize_input",
      },
    };
  }

  const { record, updated, providerResult } = await extractAndUpsertSingleProfile({
    username: normalized.username,
    profileUrl: normalized.profileUrl,
  });

  if (record.status === "completed" || record.status === "mock") {
    return {
      ok: true,
      record,
      updated,
      result: {
        username: record.username,
        profileUrl: record.profileUrl,
        displayName: record.displayName,
        profileImageUrl: record.profileImageUrl,
        bio: record.bio,
        website: record.website,
        publicEmail: record.publicEmail,
        status: record.status === "mock" ? "mock" : "success",
        extractedAt: record.extractedAt,
      },
    };
  }

  return {
    ok: false,
    record,
    updated,
    error: {
      code: record.errorCode ?? normalizeExtractorErrorCode(providerResult.errorCode),
      message: record.error ?? providerResult.error ?? "Extraction failed.",
      httpStatus: providerResult.diagnostics.httpStatus,
      step: providerResult.diagnostics.step,
    },
  };
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
  const firebase = getFirebaseDiagnostics();
  const firebaseConnected = firebase.status === "connected";
  const storageMode = getStorageMode();
  const extractionLive = isInstagramExtractionEnabled();

  let pendingQueueCount = 0;
  let resultsCount = 0;

  if (isFirestoreAvailable()) {
    try {
      const [queueItems, extractions] = await Promise.all([
        listQueueItems(),
        listExtractionResults(),
      ]);
      pendingQueueCount = queueItems.filter(
        (item) => item.status === "pending" || item.status === "running",
      ).length;
      resultsCount = extractions.length;
    } catch {
      pendingQueueCount = 0;
      resultsCount = 0;
    }
  }

  return {
    firebaseConnected,
    firebaseStatus: firebase.statusLabel,
    firebaseProjectId: firebase.projectId,
    missingFirebaseEnvVars: firebase.missingEnvVars,
    storageMode,
    mode: extractionLive ? "Live" : "Mock",
    extractionEnabled: extractionLive,
    extractionDelayMs: INSTAGRAM_EXTRACTOR_CONFIG.delayMs,
    extractionMaxRetries: INSTAGRAM_EXTRACTOR_CONFIG.maxRetries,
    workerDelayMs: getInstagramWorkerDelayMs(),
    workerMaxRetries: getInstagramWorkerMaxRetries(),
    pendingQueueCount,
    resultsCount,
    importQueueCollection: FIRESTORE_COLLECTIONS.revit24_import_queue,
    deployment: "Vercel",
  };
}
