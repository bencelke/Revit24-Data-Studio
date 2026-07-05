import {
  collection,
  doc,
  getDoc,
  getDocs,
  deleteDoc,
  setDoc,
  query,
  orderBy,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateImportJobInput,
  ImportJobDocument,
  ImportJobStatus,
} from "@/lib/types/import-jobs";

function mapJobDoc(id: string, data: DocumentData): ImportJobDocument {
  return {
    id,
    name: String(data.name ?? ""),
    type: String(data.type ?? ""),
    source: String(data.source ?? ""),
    status: data.status as ImportJobStatus,
    createdBy: String(data.createdBy ?? "system-dev"),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    totalRecords: Number(data.totalRecords ?? 0),
    validRecords: Number(data.validRecords ?? 0),
    duplicateRecords: Number(data.duplicateRecords ?? 0),
    invalidRecords: Number(data.invalidRecords ?? 0),
    notes: data.notes != null ? String(data.notes) : null,
    metadata:
      data.metadata != null && typeof data.metadata === "object"
        ? (data.metadata as Record<string, unknown>)
        : null,
  };
}

export async function createImportJob(
  input: CreateImportJobInput,
): Promise<ImportJobDocument> {
  const db = getFirestoreDb();
  const jobRef = doc(collection(db, FIRESTORE_COLLECTIONS.import_jobs));

  const payload = {
    name: input.name,
    type: input.type,
    source: input.source,
    status: input.status,
    createdBy: input.createdBy,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    totalRecords: input.totalRecords,
    validRecords: input.validRecords,
    duplicateRecords: input.duplicateRecords,
    invalidRecords: input.invalidRecords,
    notes: input.notes,
    metadata: input.metadata,
  };

  await setDoc(jobRef, payload);

  return mapJobDoc(jobRef.id, payload);
}

export async function updateImportJob(
  id: string,
  data: Partial<CreateImportJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const jobRef = doc(db, FIRESTORE_COLLECTIONS.import_jobs, id);
  const updatePayload: Record<string, unknown> = {
    ...data,
    updatedAt: isoToTimestamp(new Date().toISOString()),
  };

  if (data.createdAt) {
    updatePayload.createdAt = isoToTimestamp(data.createdAt);
  }

  await updateDoc(jobRef, updatePayload);
}

export async function deleteImportJob(id: string): Promise<void> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.import_jobs, id));
}

export async function getImportJob(id: string): Promise<ImportJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.import_jobs, id));

  if (!snapshot.exists()) {
    return null;
  }

  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listImportJobs(): Promise<ImportJobDocument[]> {
  const db = getFirestoreDb();
  const jobsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.import_jobs),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(jobsQuery);

  return snapshot.docs.map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()));
}
