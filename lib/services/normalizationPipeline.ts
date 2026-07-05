import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { seedNormalizationMockDataIfEmpty } from "@/lib/mock-data/normalizationSeedData";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  upsertNormalizedRecord as persistNormalizedRecord,
  listNormalizedRecords as fetchNormalizedRecords,
} from "@/lib/repositories/normalizedRecordsRepository";
import {
  createEntityMatch as persistEntityMatch,
  listEntityMatchesByRecordId as fetchEntityMatches,
} from "@/lib/repositories/entityMatchesRepository";
import {
  createNormalizationLog as persistNormalizationLog,
  listNormalizationLogsByRecordId as fetchNormalizationLogs,
} from "@/lib/repositories/normalizationLogsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { detectVehicleBrands, detectSpecialties } from "@/lib/services/brandDetectionService";
import {
  buildConfidenceFactors,
  calculateConfidenceScore,
} from "@/lib/services/confidenceService";
import { detectEntityType } from "@/lib/services/entityTypeService";
import {
  findPotentialMatches,
  toEntityMatchDocument,
} from "@/lib/services/entityMatchingService";
import { normalizeLocation } from "@/lib/services/locationNormalizationService";
import { normalizeRawMetadata } from "@/lib/services/normalizationService";
import { detectTags, mergeTags } from "@/lib/services/tagService";
import type { InstagramProfileDocument } from "@/lib/types/instagram-profiles";
import type {
  CreateEntityMatchInput,
  CreateNormalizationLogInput,
  CreateNormalizedRecordInput,
  EntityDetailData,
  EntityMatchDocument,
  EntitiesDashboardStats,
  EntitiesListData,
  NormalizationLogDocument,
  NormalizationResult,
  NormalizedRecordDocument,
  PipelineDashboardStats,
  RawExtractedMetadata,
} from "@/lib/types/normalization";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { listInstagramProfiles } from "@/lib/repositories/instagramProfilesRepository";
import { mockInstagramProfileStore } from "@/lib/mock-data/instagramProfileStore";
import { getQueueDashboardData } from "@/lib/services/queueService";
import { getImportJobDashboardStats } from "@/lib/services/importJobService";
import { getReviewRecordsList } from "@/lib/services/reviewService";

const NORMALIZATION_VERSION = "0.1.0-mvp";

export function instagramProfileToRaw(profile: InstagramProfileDocument): RawExtractedMetadata {
  return {
    source: "instagram",
    sourceRecordId: profile.id,
    displayName: profile.displayName,
    username: profile.username,
    bio: profile.bio,
    website: profile.website,
    publicEmail: profile.publicEmail,
    publicPhone: profile.publicPhone,
    profileUrl: profile.profileUrl,
    businessCategory: profile.businessCategory,
    country: null,
    city: null,
    verified: profile.verified,
  };
}

export function normalizeExtractedMetadata(raw: RawExtractedMetadata): CreateNormalizedRecordInput {
  const normalized = normalizeRawMetadata(raw);
  const entityType = detectEntityType(raw);
  const textForTags = [raw.displayName, raw.bio, raw.businessCategory].filter(Boolean).join(" ");
  const tags = detectTags(textForTags);
  const vehicleBrands = detectVehicleBrands(raw);
  const allTags = mergeTags(tags, vehicleBrands);
  const specialties = detectSpecialties(raw, allTags);
  const location =
    raw.latitude != null && raw.longitude != null
      ? {
          country: raw.country ?? null,
          state: raw.state ?? null,
          city: raw.city ?? null,
          area: raw.area ?? null,
          address: raw.address ?? null,
          latitude: raw.latitude,
          longitude: raw.longitude,
        }
      : normalizeLocation(raw.bio, raw.country, raw.city);

  const confidenceScore = calculateConfidenceScore(
    buildConfidenceFactors(raw, { ...normalized, ...location }, entityType, vehicleBrands, allTags),
  );

  return {
    source: raw.source,
    sourceRecordId: raw.sourceRecordId,
    entityType,
    displayName: normalized.displayName,
    username: normalized.username,
    website: normalized.website,
    publicEmail: normalized.publicEmail,
    publicPhone: normalized.publicPhone,
    country: location.country,
    state: location.state,
    city: location.city,
    area: location.area,
    address: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    description: normalized.description,
    tags: allTags,
    vehicleBrands,
    specialties,
    socialLinks: normalized.socialLinks,
    status: "pending_review",
    confidenceScore,
    normalizedAt: new Date().toISOString(),
    workerVersion: NORMALIZATION_VERSION,
  };
}

async function saveRecord(input: CreateNormalizedRecordInput): Promise<NormalizedRecordDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistNormalizedRecord(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockNormalizationStore.upsertRecord(input);
      }
      throw error;
    }
  }
  return mockNormalizationStore.upsertRecord(input);
}

async function saveMatch(input: CreateEntityMatchInput): Promise<EntityMatchDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistEntityMatch(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockNormalizationStore.createMatch(input);
      }
      throw error;
    }
  }
  return mockNormalizationStore.createMatch(input);
}

async function saveLog(input: CreateNormalizationLogInput): Promise<NormalizationLogDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistNormalizationLog(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockNormalizationStore.createLog(input);
      }
      throw error;
    }
  }
  return mockNormalizationStore.createLog(input);
}

async function loadAllRecords(): Promise<NormalizedRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchNormalizedRecords();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedNormalizationMockDataIfEmpty();
        return mockNormalizationStore.listRecords();
      }
      throw error;
    }
  }
  seedNormalizationMockDataIfEmpty();
  return mockNormalizationStore.listRecords();
}

export async function runNormalizationPipeline(
  raw: RawExtractedMetadata,
): Promise<NormalizationResult> {
  const input = normalizeExtractedMetadata(raw);
  const record = await saveRecord(input);
  const timestamp = new Date().toISOString();

  await saveLog({
    normalizedRecordId: record.id,
    timestamp,
    event: "Record Normalized",
    message: `Normalized ${record.displayName} as ${record.entityType}`,
    details: { confidenceScore: record.confidenceScore, tags: record.tags },
  });

  const existing = await loadAllRecords();
  const candidates = findPotentialMatches(record, existing);
  const matches: EntityMatchDocument[] = [];

  for (const candidate of candidates.slice(0, 5)) {
    const matchInput = toEntityMatchDocument(record.id, candidate, timestamp);
    const saved = await saveMatch(matchInput);
    matches.push(saved);
  }

  if (matches.length > 0) {
    await saveLog({
      normalizedRecordId: record.id,
      timestamp,
      event: "Matches Detected",
      message: `Found ${matches.length} potential duplicate(s) — no merge performed`,
      details: { matchCount: matches.length },
    });
  }

  return { record, matches };
}

export async function normalizeInstagramProfile(
  profile: InstagramProfileDocument,
): Promise<NormalizationResult> {
  return runNormalizationPipeline(instagramProfileToRaw(profile));
}

export async function normalizeAllCompletedInstagramProfiles(): Promise<NormalizationResult[]> {
  let profiles: InstagramProfileDocument[];
  if (isFirestoreAvailable()) {
    try {
      profiles = (await listInstagramProfiles()).filter((p) => p.status === "completed");
    } catch {
      profiles = mockInstagramProfileStore.listInstagramProfiles().filter(
        (p) => p.status === "completed",
      );
    }
  } else {
    profiles = mockInstagramProfileStore.listInstagramProfiles().filter(
      (p) => p.status === "completed",
    );
  }

  const results: NormalizationResult[] = [];
  for (const profile of profiles) {
    const existing = (await loadAllRecords()).find(
      (record) => record.sourceRecordId === profile.id,
    );
    if (existing) continue;
    results.push(await normalizeInstagramProfile(profile));
  }
  return results;
}

async function countHighConfidenceMatches(
  records: NormalizedRecordDocument[],
): Promise<number> {
  if (isFirestoreAvailable()) {
    try {
      let count = 0;
      for (const record of records) {
        const matches = await fetchEntityMatches(record.id);
        count += matches.filter((match) => match.confidenceLevel === "high").length;
      }
      return count;
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) {
        throw error;
      }
    }
  }

  return mockNormalizationStore
    .listAllMatches()
    .filter((match) => match.confidenceLevel === "high").length;
}

async function computeStats(
  records: NormalizedRecordDocument[],
): Promise<EntitiesDashboardStats> {
  return {
    totalNormalized: records.length,
    pendingReview: records.filter((r) => r.status === "pending_review").length,
    approved: records.filter((r) => r.status === "approved").length,
    highConfidenceMatches: await countHighConfidenceMatches(records),
  };
}

export async function getEntitiesListData(): Promise<EntitiesListData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const records = await loadAllRecords();

  return {
    records,
    stats: await computeStats(records),
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    warning: useFirestore ? undefined : MOCK_MODE_WARNING,
  };
}

export async function getEntityDetail(id: string): Promise<EntityDetailData | null> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const records = await loadAllRecords();
  const record = records.find((r) => r.id === id);
  if (!record) return null;

  let matches: EntityMatchDocument[];
  let logs: NormalizationLogDocument[];

  if (useFirestore) {
    try {
      matches = await fetchEntityMatches(id);
      logs = await fetchNormalizationLogs(id);
    } catch {
      matches = mockNormalizationStore.listMatchesForRecord(id);
      logs = mockNormalizationStore.listLogsForRecord(id);
    }
  } else {
    matches = mockNormalizationStore.listMatchesForRecord(id);
    logs = mockNormalizationStore.listLogsForRecord(id);
  }

  return {
    record,
    matches,
    logs,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
  };
}

export async function getPipelineDashboardStats(): Promise<PipelineDashboardStats> {
  seedNormalizationMockDataIfEmpty();

  const [importStats, queueData, normalizedRecords] = await Promise.all([
    getImportJobDashboardStats().catch(() => ({ totalImportJobs: 12 })),
    getQueueDashboardData().catch(() => ({ jobs: [] as { id: string }[] })),
    loadAllRecords(),
  ]);

  const approvedReview = (await getReviewRecordsList("approved").catch(() => ({ records: [] })))
    .records.length;

  return {
    rawImports: importStats.totalImportJobs ?? 0,
    extractionJobs: queueData.jobs?.length ?? 0,
    normalizedRecords: normalizedRecords.length,
    pendingReview: normalizedRecords.filter((r) => r.status === "pending_review").length,
    approved: normalizedRecords.filter((r) => r.status === "approved").length + approvedReview,
  };
}
