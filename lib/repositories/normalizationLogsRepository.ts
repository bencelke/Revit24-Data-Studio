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
  CreateNormalizationLogInput,
  NormalizationLogDocument,
} from "@/lib/types/normalization";

function mapLogDoc(id: string, data: DocumentData): NormalizationLogDocument {
  return {
    id,
    normalizedRecordId: String(data.normalizedRecordId ?? ""),
    timestamp: timestampToIso(data.timestamp),
    event: String(data.event ?? ""),
    message: String(data.message ?? ""),
    details:
      data.details != null && typeof data.details === "object"
        ? (data.details as Record<string, unknown>)
        : null,
  };
}

export async function createNormalizationLog(
  input: CreateNormalizationLogInput,
): Promise<NormalizationLogDocument> {
  const db = getFirestoreDb();
  const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.normalization_logs));
  const payload = {
    normalizedRecordId: input.normalizedRecordId,
    timestamp: isoToTimestamp(input.timestamp),
    event: input.event,
    message: input.message,
    details: input.details,
  };
  await setDoc(logRef, payload);
  return mapLogDoc(logRef.id, payload);
}

export async function listNormalizationLogsByRecordId(
  recordId: string,
): Promise<NormalizationLogDocument[]> {
  const db = getFirestoreDb();
  const logsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.normalization_logs),
    where("normalizedRecordId", "==", recordId),
  );
  const snapshot = await getDocs(logsQuery);
  return snapshot.docs
    .map((logDoc) => mapLogDoc(logDoc.id, logDoc.data()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
