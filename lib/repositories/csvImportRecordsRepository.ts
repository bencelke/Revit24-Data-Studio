import {
  collection,
  doc,
  getDocs,
  setDoc,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateCsvImportRecordInput,
  CsvDuplicateMatch,
  CsvImportRecordDocument,
  CsvMappedRow,
  CsvValidationStatus,
} from "@/lib/types/csv-import";

function mapRecordDoc(id: string, data: DocumentData): CsvImportRecordDocument {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    rowNumber: Number(data.rowNumber ?? 0),
    rawData: (data.rawData as Record<string, string>) ?? {},
    mappedData: (data.mappedData as CsvMappedRow) ?? {},
    validationStatus: (data.validationStatus as CsvValidationStatus) ?? "invalid",
    errors: Array.isArray(data.errors) ? data.errors.map(String) : [],
    warnings: Array.isArray(data.warnings) ? data.warnings.map(String) : [],
    duplicateMatches: Array.isArray(data.duplicateMatches) ? data.duplicateMatches as CsvDuplicateMatch[] : [],
    normalizedRecordId: data.normalizedRecordId != null ? String(data.normalizedRecordId) : null,
    reviewRecordId: data.reviewRecordId != null ? String(data.reviewRecordId) : null,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function buildPayload(input: CreateCsvImportRecordInput) {
  return {
    jobId: input.jobId,
    rowNumber: input.rowNumber,
    rawData: input.rawData,
    mappedData: input.mappedData,
    validationStatus: input.validationStatus,
    errors: input.errors,
    warnings: input.warnings,
    duplicateMatches: input.duplicateMatches,
    normalizedRecordId: input.normalizedRecordId,
    reviewRecordId: input.reviewRecordId,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
  };
}

export async function createCsvImportRecords(
  records: CreateCsvImportRecordInput[],
): Promise<CsvImportRecordDocument[]> {
  const db = getFirestoreDb();
  const batch = writeBatch(db);
  const results: CsvImportRecordDocument[] = [];

  for (const input of records) {
    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.csv_import_records));
    const payload = buildPayload(input);
    batch.set(ref, payload);
    results.push(mapRecordDoc(ref.id, payload));
  }

  await batch.commit();
  return results;
}

export async function listCsvImportRecordsByJobId(
  jobId: string,
): Promise<CsvImportRecordDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.csv_import_records));
  return snapshot.docs
    .map((recordDoc) => mapRecordDoc(recordDoc.id, recordDoc.data()))
    .filter((record) => record.jobId === jobId)
    .sort((a, b) => a.rowNumber - b.rowNumber);
}

export async function updateCsvImportRecord(
  id: string,
  data: Partial<CreateCsvImportRecordInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const ref = doc(db, FIRESTORE_COLLECTIONS.csv_import_records, id);
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.updatedAt) updatePayload.updatedAt = isoToTimestamp(data.updatedAt);
  await setDoc(ref, updatePayload, { merge: true });
}
