import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  orderBy,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateReviewHistoryInput,
  ReviewHistoryEntry,
} from "@/lib/types/review";

function mapHistoryDoc(id: string, data: DocumentData): ReviewHistoryEntry {
  return {
    id,
    recordId: String(data.recordId ?? ""),
    previousStatus: data.previousStatus as ReviewHistoryEntry["previousStatus"],
    newStatus: data.newStatus as ReviewHistoryEntry["newStatus"],
    reviewer: String(data.reviewer ?? "system-dev"),
    timestamp: timestampToIso(data.timestamp),
    reason: data.reason != null ? String(data.reason) : null,
    notes: data.notes != null ? String(data.notes) : null,
  };
}

export async function createReviewHistoryEntry(
  input: CreateReviewHistoryInput,
): Promise<ReviewHistoryEntry> {
  const db = getFirestoreDb();
  const historyRef = doc(collection(db, FIRESTORE_COLLECTIONS.review_history));

  const payload = {
    recordId: input.recordId,
    previousStatus: input.previousStatus,
    newStatus: input.newStatus,
    reviewer: input.reviewer,
    timestamp: isoToTimestamp(input.timestamp),
    reason: input.reason,
    notes: input.notes,
  };

  await setDoc(historyRef, payload);
  return mapHistoryDoc(historyRef.id, payload);
}

export async function listReviewHistoryByRecordId(
  recordId: string,
): Promise<ReviewHistoryEntry[]> {
  const db = getFirestoreDb();
  const historyQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.review_history),
    where("recordId", "==", recordId),
  );
  const snapshot = await getDocs(historyQuery);

  return snapshot.docs
    .map((historyDoc) => mapHistoryDoc(historyDoc.id, historyDoc.data()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function listRecentReviewHistory(
  max = 20,
): Promise<ReviewHistoryEntry[]> {
  const db = getFirestoreDb();
  const historyQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.review_history),
    orderBy("timestamp", "desc"),
  );
  const snapshot = await getDocs(historyQuery);

  return snapshot.docs
    .slice(0, max)
    .map((historyDoc) => mapHistoryDoc(historyDoc.id, historyDoc.data()));
}
