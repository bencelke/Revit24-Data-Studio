import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { mockInstagramExtractionQueueStore } from "@/lib/mock-data/instagramExtractionQueueStore";
import { getFirestoreDb, isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateInstagramExtractionQueueInput,
  ExtractionQueueStatus,
  InstagramExtractionQueueDocument,
} from "@/lib/types/instagramExtractionQueue";

const BATCH_LIMIT = 499;

function mapQueueDoc(id: string, data: DocumentData): InstagramExtractionQueueDocument {
  return {
    id,
    username: String(data.username ?? ""),
    profileUrl: String(data.profileUrl ?? ""),
    status: (data.status as ExtractionQueueStatus) ?? "pending",
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    startedAt: data.startedAt != null ? timestampToIso(data.startedAt) : null,
    completedAt: data.completedAt != null ? timestampToIso(data.completedAt) : null,
    attempts: Number(data.attempts ?? 0),
    errorCode: data.errorCode != null ? String(data.errorCode) : null,
    errorMessage: data.errorMessage != null ? String(data.errorMessage) : null,
  };
}

function buildQueuePayload(input: CreateInstagramExtractionQueueInput) {
  return {
    username: input.username,
    profileUrl: input.profileUrl,
    status: input.status,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    startedAt: input.startedAt ? isoToTimestamp(input.startedAt) : null,
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
    attempts: input.attempts,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
  };
}

async function createQueueItemsBatchFirestore(
  inputs: CreateInstagramExtractionQueueInput[],
): Promise<InstagramExtractionQueueDocument[]> {
  const db = getFirestoreDb();
  const persisted: InstagramExtractionQueueDocument[] = [];

  let batch = writeBatch(db);
  let operationCount = 0;

  for (const input of inputs) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.instagram_extraction_queue));
    const payload = buildQueuePayload(input);
    batch.set(ref, payload);
    persisted.push(mapQueueDoc(ref.id, payload));
    operationCount += 1;
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return persisted;
}

async function listQueueItemsFirestore(): Promise<InstagramExtractionQueueDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.instagram_extraction_queue));

  return snapshot.docs
    .map((record) => mapQueueDoc(record.id, record.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

async function findPendingQueueItemsFirestore(
  maxItems: number,
): Promise<InstagramExtractionQueueDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.instagram_extraction_queue),
      where("status", "==", "pending"),
    ),
  );

  return snapshot.docs
    .map((record) => mapQueueDoc(record.id, record.data()))
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    .slice(0, maxItems);
}

async function findPendingByUsernameFirestore(
  username: string,
): Promise<InstagramExtractionQueueDocument | null> {
  const db = getFirestoreDb();
  const normalized = username.toLowerCase();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.instagram_extraction_queue),
      where("username", "==", normalized),
    ),
  );

  const active = snapshot.docs
    .map((record) => mapQueueDoc(record.id, record.data()))
    .find((record) => record.status === "pending" || record.status === "running");

  return active ?? null;
}

async function updateQueueItemFirestore(
  id: string,
  patch: Partial<CreateInstagramExtractionQueueInput>,
): Promise<InstagramExtractionQueueDocument> {
  const db = getFirestoreDb();
  const ref = doc(db, FIRESTORE_COLLECTIONS.instagram_extraction_queue, id);
  const updatePayload: Record<string, unknown> = {};

  if (patch.username != null) updatePayload.username = patch.username;
  if (patch.profileUrl != null) updatePayload.profileUrl = patch.profileUrl;
  if (patch.status != null) updatePayload.status = patch.status;
  if (patch.updatedAt != null) updatePayload.updatedAt = isoToTimestamp(patch.updatedAt);
  if (patch.startedAt !== undefined) {
    updatePayload.startedAt = patch.startedAt ? isoToTimestamp(patch.startedAt) : null;
  }
  if (patch.completedAt !== undefined) {
    updatePayload.completedAt = patch.completedAt ? isoToTimestamp(patch.completedAt) : null;
  }
  if (patch.attempts != null) updatePayload.attempts = patch.attempts;
  if (patch.errorCode !== undefined) updatePayload.errorCode = patch.errorCode;
  if (patch.errorMessage !== undefined) updatePayload.errorMessage = patch.errorMessage;

  await updateDoc(ref, updatePayload);

  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    throw new Error(`Queue item not found: ${id}`);
  }

  return mapQueueDoc(snapshot.id, snapshot.data());
}

async function withFirestoreFallback<T>(live: () => Promise<T>, fallback: () => T): Promise<T> {
  if (isFirestoreAvailable()) {
    try {
      return await live();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return fallback();
      }
      throw error;
    }
  }

  return fallback();
}

export async function createQueueItemsBatch(
  inputs: CreateInstagramExtractionQueueInput[],
): Promise<InstagramExtractionQueueDocument[]> {
  if (inputs.length === 0) {
    return [];
  }

  return withFirestoreFallback(
    () => createQueueItemsBatchFirestore(inputs),
    () => mockInstagramExtractionQueueStore.createBatch(inputs),
  );
}

export async function listQueueItems(): Promise<InstagramExtractionQueueDocument[]> {
  return withFirestoreFallback(
    () => listQueueItemsFirestore(),
    () => mockInstagramExtractionQueueStore.list(),
  );
}

export async function findPendingQueueItems(
  maxItems: number,
): Promise<InstagramExtractionQueueDocument[]> {
  return withFirestoreFallback(
    () => findPendingQueueItemsFirestore(maxItems),
    () => mockInstagramExtractionQueueStore.findPending().slice(0, maxItems),
  );
}

export async function findActiveQueueItemByUsername(
  username: string,
): Promise<InstagramExtractionQueueDocument | null> {
  return withFirestoreFallback(
    () => findPendingByUsernameFirestore(username),
    () => {
      const existing = mockInstagramExtractionQueueStore.findByUsername(username);
      if (!existing || (existing.status !== "pending" && existing.status !== "running")) {
        return null;
      }
      return existing;
    },
  );
}

export async function updateQueueItem(
  id: string,
  patch: Partial<CreateInstagramExtractionQueueInput>,
): Promise<InstagramExtractionQueueDocument> {
  return withFirestoreFallback(
    () => updateQueueItemFirestore(id, patch),
    () => {
      const updated = mockInstagramExtractionQueueStore.update(id, patch);
      if (!updated) {
        throw new Error(`Queue item not found: ${id}`);
      }
      return updated;
    },
  );
}
