import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { mockRevit24ImportQueueStore } from "@/lib/mock-data/revit24ImportQueueStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { getFirestoreDb, isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type { ExtractedInstagramProfile } from "@/lib/types/instagramExtraction";
import type {
  CreateRevit24ImportQueueInput,
  Revit24ImportQueueDocument,
  UploadToRevit24ImportQueueResult,
} from "@/lib/types/simpleInstagramImport";
import { REVIT24_DATA_STUDIO_SOURCE } from "@/lib/types/simpleInstagramImport";

function mapQueueDoc(id: string, data: DocumentData): Revit24ImportQueueDocument {
  return {
    id,
    source: REVIT24_DATA_STUDIO_SOURCE,
    sourcePlatform: "instagram",
    username: String(data.username ?? ""),
    profileUrl: String(data.profileUrl ?? ""),
    displayName: data.displayName != null ? String(data.displayName) : null,
    profileImageUrl: data.profileImageUrl != null ? String(data.profileImageUrl) : null,
    bio: data.bio != null ? String(data.bio) : null,
    website: data.website != null ? String(data.website) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    status: data.status === "pending_review" ? "pending_review" : "pending_review",
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    uploadedAt: timestampToIso(data.uploadedAt ?? data.createdAt),
    extractedAt: timestampToIso(data.extractedAt ?? data.createdAt),
    notes: data.notes != null ? String(data.notes) : null,
  };
}

function buildPayload(input: CreateRevit24ImportQueueInput) {
  return {
    source: input.source,
    sourcePlatform: input.sourcePlatform,
    username: input.username,
    profileUrl: input.profileUrl,
    displayName: input.displayName,
    profileImageUrl: input.profileImageUrl,
    bio: input.bio,
    website: input.website,
    publicEmail: input.publicEmail,
    status: input.status,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    uploadedAt: isoToTimestamp(input.uploadedAt),
    extractedAt: isoToTimestamp(input.extractedAt),
    notes: input.notes,
  };
}

function toQueueInput(row: ExtractedInstagramProfile): CreateRevit24ImportQueueInput {
  const timestamp = new Date().toISOString();
  return {
    source: REVIT24_DATA_STUDIO_SOURCE,
    sourcePlatform: "instagram",
    username: row.username.toLowerCase(),
    profileUrl: row.profileUrl,
    displayName: row.displayName,
    profileImageUrl: row.profileImageUrl,
    bio: row.bio,
    website: row.website,
    publicEmail: row.publicEmail,
    status: "pending_review",
    createdAt: timestamp,
    updatedAt: timestamp,
    uploadedAt: timestamp,
    extractedAt: row.extractedAt,
    notes: null,
  };
}

async function loadExistingUsernames(): Promise<Set<string>> {
  const records = await listRevit24ImportQueue();
  return new Set(records.map((record) => record.username.toLowerCase()));
}

export async function listRevit24ImportQueue(): Promise<Revit24ImportQueueDocument[]> {
  if (!isFirestoreAvailable()) {
    return mockRevit24ImportQueueStore.listRecords();
  }

  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.revit24_import_queue));

  return snapshot.docs
    .map((queueDoc) => mapQueueDoc(queueDoc.id, queueDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function findImportQueueRecordByUsername(
  username: string,
): Promise<Revit24ImportQueueDocument | null> {
  const normalized = username.toLowerCase();

  if (!isFirestoreAvailable()) {
    return mockRevit24ImportQueueStore.findByUsername(normalized);
  }

  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.revit24_import_queue),
      where("username", "==", normalized),
    ),
  );

  const first = snapshot.docs[0];
  return first ? mapQueueDoc(first.id, first.data()) : null;
}

export async function deleteImportQueueRecord(id: string): Promise<boolean> {
  if (!isFirestoreAvailable()) {
    return mockRevit24ImportQueueStore.deleteRecord(id);
  }

  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.revit24_import_queue, id));
  return true;
}

async function createRevit24ImportQueueRecords(
  inputs: CreateRevit24ImportQueueInput[],
): Promise<Revit24ImportQueueDocument[]> {
  if (!isFirestoreAvailable()) {
    return mockRevit24ImportQueueStore.createRecords(inputs);
  }

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

export async function uploadToRevit24ImportQueue(
  records: ExtractedInstagramProfile[],
): Promise<UploadToRevit24ImportQueueResult> {
  const successful = records.filter((row) => row.status === "completed" || row.status === "mock");
  const failedCount = records.filter((row) => row.status === "failed").length;

  if (successful.length === 0) {
    return {
      uploadedCount: 0,
      skippedDuplicateCount: 0,
      failedCount,
      errors: ["No successfully extracted profiles to upload."],
      uploadedUsernames: [],
      duplicateUsernames: [],
      dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    };
  }

  const existing = await loadExistingUsernames();
  const duplicateUsernames: string[] = [];
  const toUpload: ExtractedInstagramProfile[] = [];
  const errors: string[] = [];

  for (const row of successful) {
    const key = row.username.toLowerCase();
    if (existing.has(key)) {
      duplicateUsernames.push(row.username);
    } else {
      toUpload.push(row);
      existing.add(key);
    }
  }

  if (toUpload.length === 0) {
    return {
      uploadedCount: 0,
      skippedDuplicateCount: duplicateUsernames.length,
      failedCount,
      errors,
      uploadedUsernames: [],
      duplicateUsernames,
      dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    };
  }

  const inputs = toUpload.map(toQueueInput);

  try {
    await createRevit24ImportQueueRecords(inputs);
    return {
      uploadedCount: inputs.length,
      skippedDuplicateCount: duplicateUsernames.length,
      failedCount,
      errors,
      uploadedUsernames: toUpload.map((row) => row.username),
      duplicateUsernames,
      dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    };
  } catch (error) {
    if (error instanceof FirestoreNotConfiguredError) {
      mockRevit24ImportQueueStore.createRecords(inputs);
      return {
        uploadedCount: inputs.length,
        skippedDuplicateCount: duplicateUsernames.length,
        failedCount,
        errors,
        uploadedUsernames: toUpload.map((row) => row.username),
        duplicateUsernames,
        dataMode: "mock",
      };
    }

    errors.push(error instanceof Error ? error.message : "Upload failed.");
    return {
      uploadedCount: 0,
      skippedDuplicateCount: duplicateUsernames.length,
      failedCount,
      errors,
      uploadedUsernames: [],
      duplicateUsernames,
      dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    };
  }
}

/** @deprecated Use listRevit24ImportQueue */
export async function listRevit24ImportQueueRecords(): Promise<Revit24ImportQueueDocument[]> {
  return listRevit24ImportQueue();
}

/** @deprecated Use listRevit24ImportQueue */
export async function listRevit24ImportQueueUsernames(): Promise<string[]> {
  const records = await listRevit24ImportQueue();
  return records.map((record) => record.username);
}

/** @deprecated Use uploadToRevit24ImportQueue */
export async function createRevit24ImportQueueRecordsLegacy(
  inputs: CreateRevit24ImportQueueInput[],
): Promise<Revit24ImportQueueDocument[]> {
  return createRevit24ImportQueueRecords(inputs);
}
