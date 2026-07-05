import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  ApprovedRecordDocument,
  CreateApprovedRecordInput,
} from "@/lib/types/review";

function mapApprovedDoc(id: string, data: DocumentData): ApprovedRecordDocument {
  return {
    id,
    importRecordId: String(data.importRecordId ?? ""),
    jobId: String(data.jobId ?? ""),
    username: data.username != null ? String(data.username) : null,
    profileUrl: data.profileUrl != null ? String(data.profileUrl) : null,
    displayName: data.displayName != null ? String(data.displayName) : null,
    importSource: String(data.importSource ?? "instagram"),
    website: data.website != null ? String(data.website) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    country: data.country != null ? String(data.country) : null,
    city: data.city != null ? String(data.city) : null,
    description: data.description != null ? String(data.description) : null,
    approvedBy: String(data.approvedBy ?? "system-dev"),
    approvedAt: timestampToIso(data.approvedAt),
    metadata:
      data.metadata != null && typeof data.metadata === "object"
        ? (data.metadata as Record<string, unknown>)
        : null,
  };
}

export async function createApprovedRecord(
  input: CreateApprovedRecordInput,
): Promise<ApprovedRecordDocument> {
  const db = getFirestoreDb();
  const recordRef = doc(collection(db, FIRESTORE_COLLECTIONS.approved_records));

  const payload = {
    importRecordId: input.importRecordId,
    jobId: input.jobId,
    username: input.username,
    profileUrl: input.profileUrl,
    displayName: input.displayName,
    importSource: input.importSource,
    website: input.website,
    publicEmail: input.publicEmail,
    tags: input.tags,
    country: input.country,
    city: input.city,
    description: input.description,
    approvedBy: input.approvedBy,
    approvedAt: isoToTimestamp(input.approvedAt),
    metadata: input.metadata,
  };

  await setDoc(recordRef, payload);
  return mapApprovedDoc(recordRef.id, payload);
}

export async function getApprovedRecord(
  id: string,
): Promise<ApprovedRecordDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.approved_records, id));

  if (!snapshot.exists()) return null;
  return mapApprovedDoc(snapshot.id, snapshot.data());
}

export async function getApprovedRecordByImportRecordId(
  importRecordId: string,
): Promise<ApprovedRecordDocument | null> {
  const records = await listApprovedRecords();
  return records.find((record) => record.importRecordId === importRecordId) ?? null;
}

export async function listApprovedRecords(): Promise<ApprovedRecordDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.approved_records));

  return snapshot.docs
    .map((recordDoc) => mapApprovedDoc(recordDoc.id, recordDoc.data()))
    .sort(
      (a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime(),
    );
}
