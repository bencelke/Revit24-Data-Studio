import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { timestampToIso } from "@/lib/firebase/timestamps";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { mockInstagramExtractionQueueStore } from "@/lib/mock-data/instagramExtractionQueueStore";
import { getFirestoreDb, isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateInstagramExtractionQueueInput,
  ExtractionQueueStatus,
  InstagramExtractionQueueDocument,
} from "@/lib/types/instagramExtractionQueue";
import { isActiveQueueStatus } from "@/lib/types/instagramExtractionQueue";

const PENDING_QUEUE_STATUSES: ExtractionQueueStatus[] = ["queued", "pending"];

function mapQueueDoc(id: string, data: DocumentData): InstagramExtractionQueueDocument {
  return {
    id: data.id != null ? String(data.id) : id,
    source: "revit24-data-studio",
    sourcePlatform: "instagram",
    username: String(data.username ?? ""),
    profileUrl: String(data.profileUrl ?? ""),
    status: (data.status as ExtractionQueueStatus) ?? "queued",
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    startedAt:
      data.startedAt != null && data.startedAt !== "" ? timestampToIso(data.startedAt) : "",
    completedAt:
      data.completedAt != null && data.completedAt !== ""
        ? timestampToIso(data.completedAt)
        : "",
    attempts: Number(data.attempts ?? 0),
    errorCode: data.errorCode != null ? String(data.errorCode) : "",
    errorMessage: data.errorMessage != null ? String(data.errorMessage) : "",
  };
}

function buildQueuePayload(input: CreateInstagramExtractionQueueInput): Record<string, unknown> {
  return {
    id: input.id,
    source: input.source,
    sourcePlatform: input.sourcePlatform,
    username: input.username,
    profileUrl: input.profileUrl,
    status: input.status,
    createdAt: input.createdAt,
    updatedAt: input.updatedAt,
    startedAt: input.startedAt,
    completedAt: input.completedAt,
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

  for (const input of inputs) {
    const ref = doc(db, FIRESTORE_COLLECTIONS.instagram_extraction_queue, input.id);
    const payload = buildQueuePayload(input);
    await setDoc(ref, payload, { merge: true });
    persisted.push(mapQueueDoc(input.id, payload));
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
      where("status", "in", PENDING_QUEUE_STATUSES),
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
    .find((record) => isActiveQueueStatus(record.status));

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
  if (patch.updatedAt != null) updatePayload.updatedAt = patch.updatedAt;
  if (patch.startedAt !== undefined) updatePayload.startedAt = patch.startedAt;
  if (patch.completedAt !== undefined) updatePayload.completedAt = patch.completedAt;
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

  if (!isFirestoreAvailable()) {
    throw new FirestoreNotConfiguredError();
  }

  return createQueueItemsBatchFirestore(inputs);
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
      if (!existing || !isActiveQueueStatus(existing.status)) {
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
