import {
  collection,
  doc,
  getDocs,
  query,
  where,
  writeBatch,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateExtractionRecordInput,
  ExtractionRecordDocument,
  ExtractionRecordStatus,
} from "@/lib/types/queue";

const BATCH_LIMIT = 499;

function mapRecordDoc(id: string, data: DocumentData): ExtractionRecordDocument {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    importRecordId: String(data.importRecordId ?? ""),
    username: data.username != null ? String(data.username) : null,
    profileUrl: data.profileUrl != null ? String(data.profileUrl) : null,
    status: (data.status as ExtractionRecordStatus) ?? "waiting",
    attempts: Number(data.attempts ?? 0),
    startedAt: data.startedAt ? timestampToIso(data.startedAt) : null,
    completedAt: data.completedAt ? timestampToIso(data.completedAt) : null,
    lastError: data.lastError != null ? String(data.lastError) : null,
    workerId: data.workerId != null ? String(data.workerId) : null,
  };
}

function buildRecordPayload(record: CreateExtractionRecordInput) {
  return {
    jobId: record.jobId,
    importRecordId: record.importRecordId,
    username: record.username,
    profileUrl: record.profileUrl,
    status: record.status,
    attempts: record.attempts,
    startedAt: record.startedAt ? isoToTimestamp(record.startedAt) : null,
    completedAt: record.completedAt ? isoToTimestamp(record.completedAt) : null,
    lastError: record.lastError,
    workerId: record.workerId,
  };
}

export async function createExtractionRecords(
  records: CreateExtractionRecordInput[],
): Promise<ExtractionRecordDocument[]> {
  const db = getFirestoreDb();
  const persisted: ExtractionRecordDocument[] = [];

  let batch = writeBatch(db);
  let operationCount = 0;

  for (const record of records) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    const recordRef = doc(collection(db, FIRESTORE_COLLECTIONS.extraction_records));
    const payload = buildRecordPayload(record);
    batch.set(recordRef, payload);
    persisted.push(mapRecordDoc(recordRef.id, payload));
    operationCount += 1;
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return persisted;
}

export async function listExtractionRecords(
  jobId: string,
): Promise<ExtractionRecordDocument[]> {
  const db = getFirestoreDb();
  const recordsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.extraction_records),
    where("jobId", "==", jobId),
  );
  const snapshot = await getDocs(recordsQuery);

  return snapshot.docs
    .map((recordDoc) => mapRecordDoc(recordDoc.id, recordDoc.data()))
    .sort((a, b) => (a.username ?? "").localeCompare(b.username ?? ""));
}

export async function listAllExtractionRecords(): Promise<ExtractionRecordDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.extraction_records));
  return snapshot.docs.map((recordDoc) =>
    mapRecordDoc(recordDoc.id, recordDoc.data()),
  );
}

export async function updateExtractionRecord(
  id: string,
  data: Partial<CreateExtractionRecordInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };

  if (data.startedAt) updatePayload.startedAt = isoToTimestamp(data.startedAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);

  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.extraction_records, id), updatePayload);
}
