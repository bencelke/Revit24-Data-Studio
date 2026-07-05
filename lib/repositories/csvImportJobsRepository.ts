import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateCsvImportJobInput,
  CsvFieldMapping,
  CsvImportJobDocument,
  CsvImportJobStatus,
} from "@/lib/types/csv-import";

function mapJobDoc(id: string, data: DocumentData): CsvImportJobDocument {
  return {
    id,
    fileName: String(data.fileName ?? ""),
    fileSize: Number(data.fileSize ?? 0),
    uploadedBy: String(data.uploadedBy ?? ""),
    uploadedAt: timestampToIso(data.uploadedAt),
    status: (data.status as CsvImportJobStatus) ?? "draft",
    totalRows: Number(data.totalRows ?? 0),
    validRows: Number(data.validRows ?? 0),
    invalidRows: Number(data.invalidRows ?? 0),
    duplicateRows: Number(data.duplicateRows ?? 0),
    mappedFields: (data.mappedFields as CsvFieldMapping) ?? {},
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    completedAt: data.completedAt != null ? timestampToIso(data.completedAt) : null,
    notes: data.notes != null ? String(data.notes) : null,
    importJobId: data.importJobId != null ? String(data.importJobId) : null,
  };
}

function buildPayload(input: CreateCsvImportJobInput) {
  return {
    fileName: input.fileName,
    fileSize: input.fileSize,
    uploadedBy: input.uploadedBy,
    uploadedAt: isoToTimestamp(input.uploadedAt),
    status: input.status,
    totalRows: input.totalRows,
    validRows: input.validRows,
    invalidRows: input.invalidRows,
    duplicateRows: input.duplicateRows,
    mappedFields: input.mappedFields,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
    notes: input.notes,
    importJobId: input.importJobId,
  };
}

export async function createCsvImportJob(
  input: CreateCsvImportJobInput,
): Promise<CsvImportJobDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.csv_import_jobs));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapJobDoc(ref.id, payload);
}

export async function getCsvImportJob(id: string): Promise<CsvImportJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.csv_import_jobs, id));
  if (!snapshot.exists()) return null;
  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listCsvImportJobs(): Promise<CsvImportJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.csv_import_jobs));
  return snapshot.docs
    .map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateCsvImportJob(
  id: string,
  data: Partial<CreateCsvImportJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.uploadedAt) updatePayload.uploadedAt = isoToTimestamp(data.uploadedAt);
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.updatedAt) updatePayload.updatedAt = isoToTimestamp(data.updatedAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.csv_import_jobs, id), updatePayload);
}
