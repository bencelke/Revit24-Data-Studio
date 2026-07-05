import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { mockMergeHistoryStore } from "@/lib/mock-data/mergeHistoryStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  updateEntityMatch as persistUpdateEntityMatch,
} from "@/lib/repositories/entityMatchesRepository";
import {
  createMergeHistory as persistMergeHistory,
} from "@/lib/repositories/mergeHistoryRepository";
import {
  getNormalizedRecord as fetchNormalizedRecord,
  updateNormalizedRecord as persistUpdateNormalizedRecord,
  upsertNormalizedRecord as persistUpsertNormalizedRecord,
} from "@/lib/repositories/normalizedRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateNormalizedRecordInputPreview,
  EntityMatchDocument,
  MergeAction,
  MergeFieldKey,
  MergeFieldSelection,
  MergeFieldSelections,
  MergePreviewData,
  MatchResolution,
  ResolveMatchPayload,
} from "@/lib/types/duplicates";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import { MERGE_FIELD_KEYS } from "@/lib/types/duplicates";

const PERFORMED_BY = "reviewer-dev";
const WORKER_VERSION = "0.1.0-mvp";

export function getDefaultFieldSelections(): MergeFieldSelections {
  return Object.fromEntries(
    MERGE_FIELD_KEYS.map((key) => [key, "record_a" as MergeFieldSelection]),
  ) as MergeFieldSelections;
}

function pickField<T>(a: T, b: T, selection: MergeFieldSelection | undefined): T | null {
  switch (selection) {
    case "record_b":
      return b ?? null;
    case "clear":
      return null;
    case "combine":
      if (Array.isArray(a) && Array.isArray(b)) {
        return [...new Set([...a, ...b])] as T;
      }
      if (typeof a === "string" && typeof b === "string") {
        return (a && b && a !== b ? `${a} / ${b}` : a || b) as T;
      }
      return (a ?? b) as T;
    case "record_a":
    default:
      return a ?? b ?? null;
  }
}

export function buildMergePreview(
  recordA: NormalizedRecordDocument,
  recordB: NormalizedRecordDocument,
  selections: MergeFieldSelections = getDefaultFieldSelections(),
): CreateNormalizedRecordInputPreview {
  const combineSocial = (sel: MergeFieldSelection | undefined) => {
    if (sel === "record_b") return recordB.socialLinks;
    if (sel === "clear") return {};
    if (sel === "combine") {
      return { ...recordA.socialLinks, ...recordB.socialLinks };
    }
    return recordA.socialLinks;
  };

  const locationSel = selections.location ?? "record_a";
  let country = recordA.country;
  let state = recordA.state;
  let city = recordA.city;
  let area = recordA.area;
  let address = recordA.address;
  let latitude = recordA.latitude;
  let longitude = recordA.longitude;

  if (locationSel === "record_b") {
    ({ country, state, city, area, address, latitude, longitude } = recordB);
  } else if (locationSel === "clear") {
    country = state = city = area = address = null;
    latitude = longitude = null;
  } else if (locationSel === "combine") {
    country = recordA.country ?? recordB.country;
    state = recordA.state ?? recordB.state;
    city = recordA.city ?? recordB.city;
    area = recordA.area ?? recordB.area;
    address = recordA.address ?? recordB.address;
    latitude = recordA.latitude ?? recordB.latitude;
    longitude = recordA.longitude ?? recordB.longitude;
  }

  return {
    displayName: pickField(recordA.displayName, recordB.displayName, selections.displayName) ?? recordA.displayName,
    entityType: pickField(recordA.entityType, recordB.entityType, selections.entityType) ?? recordA.entityType,
    username: pickField(recordA.username, recordB.username, selections.username),
    website: pickField(recordA.website, recordB.website, selections.website),
    publicEmail: pickField(recordA.publicEmail, recordB.publicEmail, selections.publicEmail),
    publicPhone: pickField(recordA.publicPhone, recordB.publicPhone, selections.publicPhone),
    country,
    state,
    city,
    area,
    address,
    latitude,
    longitude,
    description: pickField(recordA.description, recordB.description, selections.description),
    tags: pickField(recordA.tags, recordB.tags, selections.tags) ?? [],
    vehicleBrands: pickField(recordA.vehicleBrands, recordB.vehicleBrands, selections.vehicleBrands) ?? [],
    specialties: pickField(recordA.specialties, recordB.specialties, selections.specialties) ?? [],
    socialLinks: combineSocial(selections.socialLinks),
  };
}

export function prepareMergePreviewData(
  recordA: NormalizedRecordDocument,
  recordB: NormalizedRecordDocument,
): MergePreviewData {
  const defaultSelections = getDefaultFieldSelections();
  return {
    recordA,
    recordB,
    preview: buildMergePreview(recordA, recordB, defaultSelections),
    defaultSelections,
  };
}

async function getRecord(id: string): Promise<NormalizedRecordDocument | null> {
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

async function updateRecord(
  id: string,
  data: Partial<import("@/lib/types/normalization").CreateNormalizedRecordInput>,
): Promise<NormalizedRecordDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await persistUpdateNormalizedRecord(id, data);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.updateRecord(id, data);
      throw error;
    }
  }
  return mockNormalizationStore.updateRecord(id, data);
}

async function upsertCanonical(
  input: import("@/lib/types/normalization").CreateNormalizedRecordInput,
): Promise<NormalizedRecordDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistUpsertNormalizedRecord(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.upsertRecord(input);
      throw error;
    }
  }
  return mockNormalizationStore.upsertRecord(input);
}

async function updateMatch(
  id: string,
  data: Partial<Omit<EntityMatchDocument, "id">>,
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateEntityMatch(id, data);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockNormalizationStore.updateMatch(id, data);
        return;
      }
      throw error;
    }
  }
  mockNormalizationStore.updateMatch(id, data);
}

async function saveHistory(
  input: import("@/lib/types/duplicates").CreateMergeHistoryInput,
): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistMergeHistory(input);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockMergeHistoryStore.create(input);
        return;
      }
      throw error;
    }
  }
  mockMergeHistoryStore.create(input);
}

function actionToResolution(action: MergeAction): MatchResolution | null {
  switch (action) {
    case "merge":
      return "merge";
    case "keep_separate":
      return "keep_separate";
    case "mark_duplicate":
      return "mark_duplicate";
    case "approve_both":
      return "approve_both";
    case "ignore_match":
      return null;
    case "needs_review":
      return null;
    default:
      return null;
  }
}

function actionToStatus(action: MergeAction): EntityMatchDocument["status"] {
  switch (action) {
    case "ignore_match":
      return "ignored";
    case "needs_review":
      return "needs_review";
    case "merge":
    case "keep_separate":
    case "mark_duplicate":
    case "approve_both":
      return "resolved";
    default:
      return "pending";
  }
}

export async function resolveMatch(
  match: EntityMatchDocument,
  payload: ResolveMatchPayload,
): Promise<{ success: boolean; resultRecordId?: string }> {
  const recordA = await getRecord(match.recordAId);
  const recordB = await getRecord(match.recordBId);
  if (!recordA || !recordB) return { success: false };

  const timestamp = new Date().toISOString();
  const performedBy = payload.performedBy ?? PERFORMED_BY;
  const selections = payload.fieldSelections ?? getDefaultFieldSelections();
  let resultRecordId: string | null = null;

  switch (payload.action) {
    case "merge": {
      const preview = buildMergePreview(recordA, recordB, selections);
      const canonical = await upsertCanonical({
        source: recordA.source,
        sourceRecordId: recordA.sourceRecordId,
        entityType: preview.entityType as NormalizedRecordDocument["entityType"],
        displayName: preview.displayName,
        username: preview.username,
        website: preview.website,
        publicEmail: preview.publicEmail,
        publicPhone: preview.publicPhone,
        country: preview.country,
        state: preview.state,
        city: preview.city,
        area: preview.area,
        address: preview.address,
        latitude: preview.latitude,
        longitude: preview.longitude,
        description: preview.description,
        tags: preview.tags,
        vehicleBrands: preview.vehicleBrands,
        specialties: preview.specialties,
        socialLinks: preview.socialLinks,
        status: "approved",
        confidenceScore: Math.max(recordA.confidenceScore, recordB.confidenceScore),
        normalizedAt: timestamp,
        workerVersion: WORKER_VERSION,
      });
      resultRecordId = canonical.id;
      await updateRecord(recordA.id, { status: "merged" });
      await updateRecord(recordB.id, { status: "duplicate" });
      break;
    }
    case "mark_duplicate":
      await updateRecord(recordB.id, { status: "duplicate" });
      break;
    case "approve_both":
      await updateRecord(recordA.id, { status: "approved" });
      await updateRecord(recordB.id, { status: "approved" });
      break;
    case "keep_separate":
    case "ignore_match":
    case "needs_review":
      break;
  }

  const resolution = actionToResolution(payload.action);
  const status = actionToStatus(payload.action);

  await updateMatch(match.id, {
    status,
    resolution,
    resolvedBy: performedBy,
    resolvedAt: timestamp,
    updatedAt: timestamp,
    notes: payload.notes ?? match.notes,
  });

  await saveHistory({
    matchId: match.id,
    recordAId: match.recordAId,
    recordBId: match.recordBId,
    action: payload.action,
    performedBy,
    performedAt: timestamp,
    notes: payload.notes ?? null,
    fieldSelections: payload.action === "merge" ? selections : null,
    resultRecordId,
  });

  return { success: true, resultRecordId: resultRecordId ?? undefined };
}

export function updateFieldSelection(
  current: MergeFieldSelections,
  field: MergeFieldKey,
  selection: MergeFieldSelection,
): MergeFieldSelections {
  return { ...current, [field]: selection };
}
