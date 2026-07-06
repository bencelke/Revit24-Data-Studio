import {
  collection,
  doc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateRevit24ImportQueueInput,
  Revit24ImportQueueDocument,
} from "@/lib/types/simpleInstagramImport";

function mapQueueDoc(id: string, data: DocumentData): Revit24ImportQueueDocument {
  return {
    id,
    source: "instagram",
    username: String(data.username ?? ""),
    profileUrl: String(data.profileUrl ?? ""),
    displayName: data.displayName != null ? String(data.displayName) : null,
    profileImageUrl: data.profileImageUrl != null ? String(data.profileImageUrl) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    status: "pending_review",
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function buildPayload(input: CreateRevit24ImportQueueInput) {
  return {
    source: input.source,
    username: input.username,
    profileUrl: input.profileUrl,
    displayName: input.displayName,
    profileImageUrl: input.profileImageUrl,
    publicEmail: input.publicEmail,
    status: input.status,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
  };
}

export async function createRevit24ImportQueueRecords(
  inputs: CreateRevit24ImportQueueInput[],
): Promise<Revit24ImportQueueDocument[]> {
  const db = getFirestoreDb();
  const records: Revit24ImportQueueDocument[] = [];

  for (const input of inputs) {
    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.revit24_import_queue));
    const payload = buildPayload(input);
    await setDoc(ref, payload);
    records.push(mapQueueDoc(ref.id, payload));
  }

  return records;
}

export async function listRevit24ImportQueueRecords(): Promise<Revit24ImportQueueDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.revit24_import_queue));

  return snapshot.docs
    .map((queueDoc) => mapQueueDoc(queueDoc.id, queueDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listRevit24ImportQueueUsernames(): Promise<string[]> {
  const records = await listRevit24ImportQueueRecords();
  return records.map((record) => record.username);
}
