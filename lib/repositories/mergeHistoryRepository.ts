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
  CreateMergeHistoryInput,
  MergeAction,
  MergeFieldSelections,
  MergeHistoryDocument,
} from "@/lib/types/duplicates";

function mapHistoryDoc(id: string, data: DocumentData): MergeHistoryDocument {
  return {
    id,
    matchId: String(data.matchId ?? ""),
    recordAId: String(data.recordAId ?? ""),
    recordBId: String(data.recordBId ?? ""),
    action: (data.action as MergeAction) ?? "keep_separate",
    performedBy: String(data.performedBy ?? "system"),
    performedAt: timestampToIso(data.performedAt),
    notes: data.notes != null ? String(data.notes) : null,
    fieldSelections: (data.fieldSelections as MergeFieldSelections) ?? null,
    resultRecordId: data.resultRecordId != null ? String(data.resultRecordId) : null,
  };
}

export async function createMergeHistory(
  input: CreateMergeHistoryInput,
): Promise<MergeHistoryDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.merge_history));
  const payload = {
    matchId: input.matchId,
    recordAId: input.recordAId,
    recordBId: input.recordBId,
    action: input.action,
    performedBy: input.performedBy,
    performedAt: isoToTimestamp(input.performedAt),
    notes: input.notes,
    fieldSelections: input.fieldSelections,
    resultRecordId: input.resultRecordId,
  };
  await setDoc(ref, payload);
  return mapHistoryDoc(ref.id, payload);
}

export async function listMergeHistoryByMatchId(
  matchId: string,
): Promise<MergeHistoryDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.merge_history),
      where("matchId", "==", matchId),
    ),
  );
  return snapshot.docs
    .map((historyDoc) => mapHistoryDoc(historyDoc.id, historyDoc.data()))
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
}

export async function listMergeHistory(): Promise<MergeHistoryDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.merge_history));
  return snapshot.docs
    .map((historyDoc) => mapHistoryDoc(historyDoc.id, historyDoc.data()))
    .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
}
