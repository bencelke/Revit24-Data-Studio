import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { mockMergeHistoryStore } from "@/lib/mock-data/mergeHistoryStore";
import { seedDuplicateMockDataIfEmpty } from "@/lib/mock-data/duplicateSeedData";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  getEntityMatch as fetchEntityMatch,
  listEntityMatches as fetchEntityMatches,
} from "@/lib/repositories/entityMatchesRepository";
import {
  listMergeHistoryByMatchId as fetchMergeHistoryByMatchId,
} from "@/lib/repositories/mergeHistoryRepository";
import {
  getNormalizedRecord as fetchNormalizedRecord,
} from "@/lib/repositories/normalizedRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { isToday } from "@/lib/services/matchScoringService";
import { prepareMergePreviewData, resolveMatch } from "@/lib/services/mergeService";
import type {
  DuplicateDashboardStats,
  DuplicateFilterParams,
  DuplicateListResult,
  DuplicateMatchDetailData,
  DuplicateMatchView,
  DuplicatesDashboardData,
  EntityMatchDocument,
  EntityMatchStatus,
  MergePreviewData,
  ResolveMatchPayload,
} from "@/lib/types/duplicates";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";

const DEFAULT_PAGE_SIZE = 10;

async function loadMatches(): Promise<EntityMatchDocument[]> {
  seedDuplicateMockDataIfEmpty();
  if (isFirestoreAvailable()) {
    try {
      return await fetchEntityMatches();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.listAllMatches();
      throw error;
    }
  }
  return mockNormalizationStore.listAllMatches();
}

async function loadRecord(id: string): Promise<NormalizedRecordDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchNormalizedRecord(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.getRecord(id);
      throw error;
    }
  }
  return mockNormalizationStore.getRecord(id);
}

async function enrichMatch(
  match: EntityMatchDocument,
  records: Map<string, NormalizedRecordDocument>,
): Promise<DuplicateMatchView> {
  const recordA = records.get(match.recordAId);
  const recordB = records.get(match.recordBId);
  return {
    ...match,
    recordAName: recordA?.displayName ?? "Unknown",
    recordBName: recordB?.displayName ?? match.matchedDisplayName ?? "Unknown",
  };
}

async function buildRecordMap(): Promise<Map<string, NormalizedRecordDocument>> {
  const records = isFirestoreAvailable()
    ? await (async () => {
        try {
          const { listNormalizedRecords } = await import("@/lib/repositories/normalizedRecordsRepository");
          return await listNormalizedRecords();
        } catch (error) {
          if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.listRecords();
          throw error;
        }
      })()
    : mockNormalizationStore.listRecords();

  return new Map(records.map((record) => [record.id, record]));
}

function computeStats(matches: EntityMatchDocument[]): DuplicateDashboardStats {
  const pending = matches.filter((m) => m.status === "pending");
  return {
    pendingMatches: pending.length,
    highConfidence: pending.filter((m) => m.confidence === "high").length,
    mediumConfidence: pending.filter((m) => m.confidence === "medium").length,
    lowConfidence: pending.filter((m) => m.confidence === "low" || m.confidence === "possible").length,
    resolvedToday: matches.filter((m) => m.status === "resolved" && m.resolvedAt && isToday(m.resolvedAt)).length,
    ignoredToday: matches.filter((m) => m.status === "ignored" && m.resolvedAt && isToday(m.resolvedAt)).length,
  };
}

function filterMatches(
  views: DuplicateMatchView[],
  params: DuplicateFilterParams,
): DuplicateMatchView[] {
  const search = params.search?.trim().toLowerCase() ?? "";
  return views.filter((match) => {
    if (params.status && params.status !== "all" && match.status !== params.status) return false;
    if (params.confidence && params.confidence !== "all" && match.confidence !== params.confidence) return false;
    if (params.reason && params.reason !== "all" && !match.reasons.includes(params.reason)) return false;
    if (!search) return true;
    return (
      match.recordAName.toLowerCase().includes(search) ||
      match.recordBName.toLowerCase().includes(search) ||
      match.reasons.some((r) => r.includes(search))
    );
  });
}

function sortMatches(
  views: DuplicateMatchView[],
  params: DuplicateFilterParams,
): DuplicateMatchView[] {
  const field = params.sortField ?? "createdAt";
  const dir = params.sortDirection === "asc" ? 1 : -1;
  return [...views].sort((a, b) => {
    switch (field) {
      case "confidenceScore":
        return (a.confidenceScore - b.confidenceScore) * dir;
      case "status":
        return a.status.localeCompare(b.status) * dir;
      default:
        return (new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()) * dir;
    }
  });
}

export async function getDuplicatesDashboardData(): Promise<DuplicatesDashboardData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const matches = await loadMatches();
  const recordMap = await buildRecordMap();
  const enriched = await Promise.all(matches.map((m) => enrichMatch(m, recordMap)));

  return {
    stats: computeStats(matches),
    recentMatches: enriched.filter((m) => m.status === "pending").slice(0, 8),
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    warning: useFirestore ? undefined : MOCK_MODE_WARNING,
  };
}

export async function listDuplicateMatches(
  params: DuplicateFilterParams = {},
): Promise<DuplicateListResult> {
  const matches = await loadMatches();
  const recordMap = await buildRecordMap();
  const enriched = await Promise.all(matches.map((m) => enrichMatch(m, recordMap)));
  const filtered = sortMatches(filterMatches(enriched, params), params);

  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    matches: filtered.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getDuplicateMatchDetail(
  matchId: string,
): Promise<DuplicateMatchDetailData | null> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();

  let match: EntityMatchDocument | null;
  if (isFirestoreAvailable()) {
    try {
      match = await fetchEntityMatch(matchId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) match = mockNormalizationStore.getMatch(matchId);
      else throw error;
    }
  } else {
    match = mockNormalizationStore.getMatch(matchId);
  }

  if (!match) return null;

  const [recordA, recordB] = await Promise.all([
    loadRecord(match.recordAId),
    loadRecord(match.recordBId),
  ]);
  if (!recordA || !recordB) return null;

  let history;
  if (isFirestoreAvailable()) {
    try {
      history = await fetchMergeHistoryByMatchId(matchId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) history = mockMergeHistoryStore.listByMatchId(matchId);
      else throw error;
    }
  } else {
    history = mockMergeHistoryStore.listByMatchId(matchId);
  }

  return {
    match,
    recordA,
    recordB,
    history,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
  };
}

export async function getMergePreviewForMatch(matchId: string): Promise<MergePreviewData | null> {
  const detail = await getDuplicateMatchDetail(matchId);
  if (!detail) return null;
  return prepareMergePreviewData(detail.recordA, detail.recordB);
}

export async function performMatchResolution(
  matchId: string,
  payload: ResolveMatchPayload,
): Promise<{ success: boolean; resultRecordId?: string }> {
  let match: EntityMatchDocument | null;
  if (isFirestoreAvailable()) {
    try {
      match = await fetchEntityMatch(matchId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) match = mockNormalizationStore.getMatch(matchId);
      else throw error;
    }
  } else {
    match = mockNormalizationStore.getMatch(matchId);
  }

  if (!match) return { success: false };
  return resolveMatch(match, payload);
}

export function statusFilterForPage(page: "pending" | "resolved" | "ignored"): EntityMatchStatus | "all" {
  if (page === "resolved") return "resolved";
  if (page === "ignored") return "ignored";
  return "pending";
}

export { computeStats as computeDuplicateStats };
