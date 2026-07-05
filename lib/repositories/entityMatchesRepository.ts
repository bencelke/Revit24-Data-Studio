import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateEntityMatchInput,
  EntityMatchDocument,
  EntityMatchStatus,
  MatchReason,
  MatchResolution,
  MatchType,
} from "@/lib/types/duplicates";
import type { MatchConfidenceLevel } from "@/lib/types/normalization";

function mapReasons(data: DocumentData): MatchReason[] {
  if (Array.isArray(data.reasons)) return data.reasons as MatchReason[];
  if (Array.isArray(data.matchFields)) {
    return data.matchFields.map(String) as MatchReason[];
  }
  return [];
}

function mapMatchDoc(id: string, data: DocumentData): EntityMatchDocument {
  const recordAId = String(data.recordAId ?? data.normalizedRecordId ?? "");
  const recordBId = String(data.recordBId ?? data.matchedRecordId ?? "");
  const confidence = (data.confidence ?? data.confidenceLevel) as MatchConfidenceLevel;

  return {
    id,
    recordAId,
    recordBId,
    matchType: (data.matchType as MatchType) ?? "automatic",
    confidence: confidence ?? "possible",
    confidenceScore: Number(data.confidenceScore ?? 0),
    status: (data.status as EntityMatchStatus) ?? "pending",
    reasons: mapReasons(data),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt ?? data.createdAt),
    resolvedBy: data.resolvedBy != null ? String(data.resolvedBy) : null,
    resolvedAt: data.resolvedAt != null ? timestampToIso(data.resolvedAt) : null,
    resolution: (data.resolution as MatchResolution) ?? null,
    notes: data.notes != null ? String(data.notes) : null,
    matchedDisplayName: data.matchedDisplayName != null ? String(data.matchedDisplayName) : undefined,
  };
}

function buildPayload(input: CreateEntityMatchInput) {
  return {
    recordAId: input.recordAId,
    recordBId: input.recordBId,
    normalizedRecordId: input.recordAId,
    matchedRecordId: input.recordBId,
    matchType: input.matchType,
    confidence: input.confidence,
    confidenceLevel: input.confidence,
    confidenceScore: input.confidenceScore,
    status: input.status,
    reasons: input.reasons,
    matchFields: input.reasons,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    resolvedBy: input.resolvedBy,
    resolvedAt: input.resolvedAt ? isoToTimestamp(input.resolvedAt) : null,
    resolution: input.resolution,
    notes: input.notes,
    matchedDisplayName: input.matchedDisplayName ?? null,
  };
}

export async function createEntityMatch(
  input: CreateEntityMatchInput,
): Promise<EntityMatchDocument> {
  const db = getFirestoreDb();
  const matchRef = doc(collection(db, FIRESTORE_COLLECTIONS.entity_matches));
  const payload = buildPayload(input);
  await setDoc(matchRef, payload);
  return mapMatchDoc(matchRef.id, payload);
}

export async function getEntityMatch(id: string): Promise<EntityMatchDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.entity_matches, id));
  if (!snapshot.exists()) return null;
  return mapMatchDoc(snapshot.id, snapshot.data());
}

export async function listEntityMatches(): Promise<EntityMatchDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.entity_matches));
  return snapshot.docs
    .map((matchDoc) => mapMatchDoc(matchDoc.id, matchDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listEntityMatchesByRecordId(
  recordId: string,
): Promise<EntityMatchDocument[]> {
  const db = getFirestoreDb();
  const [asA, asB] = await Promise.all([
    getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.entity_matches),
        where("recordAId", "==", recordId),
      ),
    ),
    getDocs(
      query(
        collection(db, FIRESTORE_COLLECTIONS.entity_matches),
        where("recordBId", "==", recordId),
      ),
    ),
  ]);

  const legacyA = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.entity_matches),
      where("normalizedRecordId", "==", recordId),
    ),
  );

  const byId = new Map<string, EntityMatchDocument>();
  for (const snapshot of [asA, asB, legacyA]) {
    for (const matchDoc of snapshot.docs) {
      byId.set(matchDoc.id, mapMatchDoc(matchDoc.id, matchDoc.data()));
    }
  }

  return [...byId.values()].sort((a, b) => b.confidenceScore - a.confidenceScore);
}

export async function updateEntityMatch(
  id: string,
  data: Partial<CreateEntityMatchInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.updatedAt) updatePayload.updatedAt = isoToTimestamp(data.updatedAt);
  if (data.resolvedAt) updatePayload.resolvedAt = isoToTimestamp(data.resolvedAt);
  if (data.recordAId) updatePayload.normalizedRecordId = data.recordAId;
  if (data.recordBId) {
    updatePayload.matchedRecordId = data.recordBId;
  }
  if (data.confidence) updatePayload.confidenceLevel = data.confidence;
  if (data.reasons) updatePayload.matchFields = data.reasons;
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.entity_matches, id), updatePayload);
}
