import {
  collection,
  doc,
  getDocs,
  deleteDoc,
  query,
  where,
  updateDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateImportRecordInput,
  ImportRecordDocument,
  ImportRecordStatus,
} from "@/lib/types/import-jobs";

const BATCH_LIMIT = 499;

function mapRecordDoc(id: string, data: DocumentData): ImportRecordDocument {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    originalInput: String(data.originalInput ?? ""),
    username: data.username != null ? String(data.username) : null,
    profileUrl: data.profileUrl != null ? String(data.profileUrl) : null,
    status: data.status as ImportRecordStatus,
    error: data.error != null ? String(data.error) : null,
    duplicateOf: data.duplicateOf != null ? String(data.duplicateOf) : null,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function createImportRecords(
  records: CreateImportRecordInput[],
): Promise<ImportRecordDocument[]> {
  const db = getFirestoreDb();
  const persisted: ImportRecordDocument[] = [];

  let batch = writeBatch(db);
  let operationCount = 0;

  for (const record of records) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    const recordRef = doc(collection(db, FIRESTORE_COLLECTIONS.import_records));
    const payload = {
      jobId: record.jobId,
      originalInput: record.originalInput,
      username: record.username,
      profileUrl: record.profileUrl,
      status: record.status,
      error: record.error,
      duplicateOf: record.duplicateOf,
      createdAt: isoToTimestamp(record.createdAt),
      updatedAt: isoToTimestamp(record.updatedAt),
    };

    batch.set(recordRef, payload);
    persisted.push(mapRecordDoc(recordRef.id, payload));
    operationCount += 1;
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return persisted;
}

export async function listImportRecords(
  jobId: string,
): Promise<ImportRecordDocument[]> {
  const db = getFirestoreDb();
  const recordsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.import_records),
    where("jobId", "==", jobId),
  );
  const snapshot = await getDocs(recordsQuery);

  return snapshot.docs
    .map((recordDoc) => mapRecordDoc(recordDoc.id, recordDoc.data()))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
}

export async function updateImportRecord(
  id: string,
  data: Partial<CreateImportRecordInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const recordRef = doc(db, FIRESTORE_COLLECTIONS.import_records, id);
  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: isoToTimestamp(new Date().toISOString()),
  };

  if (data.createdAt) {
    updatePayload.createdAt = isoToTimestamp(data.createdAt);
  }

  await updateDoc(recordRef, updatePayload);
}

export async function deleteImportRecord(id: string): Promise<void> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.import_records, id));
}

export async function countImportRecords(jobId: string): Promise<number> {
  const records = await listImportRecords(jobId);
  return records.length;
}

export async function findExistingRecordsByUsernames(
  usernames: string[],
): Promise<Map<string, { id: string; username: string }>> {
  const db = getFirestoreDb();
  const existing = new Map<string, { id: string; username: string }>();
  const unique = [...new Set(usernames.map((username) => username.toLowerCase()))];

  for (let index = 0; index < unique.length; index += 30) {
    const chunk = unique.slice(index, index + 30);
    const recordsQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.import_records),
      where("username", "in", chunk),
    );
    const snapshot = await getDocs(recordsQuery);

    snapshot.docs.forEach((recordDoc) => {
      const data = recordDoc.data();
      const username = String(data.username ?? "").toLowerCase();

      if (username) {
        existing.set(username, {
          id: recordDoc.id,
          username: String(data.username),
        });
      }
    });
  }

  return existing;
}

export async function deleteImportRecordsByJobId(jobId: string): Promise<void> {
  const records = await listImportRecords(jobId);
  const db = getFirestoreDb();

  let batch = writeBatch(db);
  let operationCount = 0;

  for (const record of records) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    batch.delete(doc(db, FIRESTORE_COLLECTIONS.import_records, record.id));
    operationCount += 1;
  }

  if (operationCount > 0) {
    await batch.commit();
  }
}
