import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateEntityMatchInput,
  EntityMatchDocument,
  MatchConfidenceLevel,
} from "@/lib/types/normalization";

function mapMatchDoc(id: string, data: DocumentData): EntityMatchDocument {
  return {
    id,
    normalizedRecordId: String(data.normalizedRecordId ?? ""),
    matchedRecordId: String(data.matchedRecordId ?? ""),
    matchedDisplayName: String(data.matchedDisplayName ?? ""),
    matchFields: Array.isArray(data.matchFields) ? data.matchFields.map(String) : [],
    confidenceLevel: (data.confidenceLevel as MatchConfidenceLevel) ?? "possible",
    confidenceScore: Number(data.confidenceScore ?? 0),
    createdAt: timestampToIso(data.createdAt),
  };
}

export async function createEntityMatch(
  input: CreateEntityMatchInput,
): Promise<EntityMatchDocument> {
  const db = getFirestoreDb();
  const matchRef = doc(collection(db, FIRESTORE_COLLECTIONS.entity_matches));
  const payload = {
    normalizedRecordId: input.normalizedRecordId,
    matchedRecordId: input.matchedRecordId,
    matchedDisplayName: input.matchedDisplayName,
    matchFields: input.matchFields,
    confidenceLevel: input.confidenceLevel,
    confidenceScore: input.confidenceScore,
    createdAt: isoToTimestamp(input.createdAt),
  };
  await setDoc(matchRef, payload);
  return mapMatchDoc(matchRef.id, payload);
}

export async function listEntityMatchesByRecordId(
  recordId: string,
): Promise<EntityMatchDocument[]> {
  const db = getFirestoreDb();
  const matchesQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.entity_matches),
    where("normalizedRecordId", "==", recordId),
  );
  const snapshot = await getDocs(matchesQuery);
  return snapshot.docs
    .map((matchDoc) => mapMatchDoc(matchDoc.id, matchDoc.data()))
    .sort((a, b) => b.confidenceScore - a.confidenceScore);
}
