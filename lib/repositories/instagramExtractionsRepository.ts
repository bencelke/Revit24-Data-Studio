import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { mockInstagramExtractionsStore } from "@/lib/mock-data/instagramExtractionsStore";
import { getFirestoreDb, isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateInstagramExtractionInput,
  ExtractionStatus,
  InstagramExtractionDocument,
} from "@/lib/types/instagramExtraction";

const BATCH_LIMIT = 499;

function mapExtractionDoc(id: string, data: DocumentData): InstagramExtractionDocument {
  return {
    id,
    source: "instagram",
    username: String(data.username ?? ""),
    profileUrl: String(data.profileUrl ?? ""),
    profileImageUrl: data.profileImageUrl != null ? String(data.profileImageUrl) : null,
    displayName: data.displayName != null ? String(data.displayName) : null,
    bio: data.bio != null ? String(data.bio) : null,
    website: data.website != null ? String(data.website) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    status: (data.status as ExtractionStatus) ?? "completed",
    error: data.error != null ? String(data.error) : null,
    extractedAt: timestampToIso(data.extractedAt),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function buildPayload(input: CreateInstagramExtractionInput) {
  return {
    source: input.source,
    username: input.username,
    profileUrl: input.profileUrl,
    profileImageUrl: input.profileImageUrl,
    displayName: input.displayName,
    bio: input.bio,
    website: input.website,
    publicEmail: input.publicEmail,
    status: input.status,
    error: input.error,
    extractedAt: isoToTimestamp(input.extractedAt),
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
  };
}

async function createExtractionResultFirestore(
  input: CreateInstagramExtractionInput,
): Promise<InstagramExtractionDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.instagram_extractions));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapExtractionDoc(ref.id, payload);
}

async function createExtractionResultsBatchFirestore(
  inputs: CreateInstagramExtractionInput[],
): Promise<InstagramExtractionDocument[]> {
  const db = getFirestoreDb();
  const persisted: InstagramExtractionDocument[] = [];

  let batch = writeBatch(db);
  let operationCount = 0;

  for (const input of inputs) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.instagram_extractions));
    const payload = buildPayload(input);
    batch.set(ref, payload);
    persisted.push(mapExtractionDoc(ref.id, payload));
    operationCount += 1;
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return persisted;
}

async function listExtractionResultsFirestore(): Promise<InstagramExtractionDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.instagram_extractions));

  return snapshot.docs
    .map((record) => mapExtractionDoc(record.id, record.data()))
    .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());
}

async function findByUsernameFirestore(username: string): Promise<InstagramExtractionDocument | null> {
  const db = getFirestoreDb();
  const normalized = username.toLowerCase();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.instagram_extractions),
      where("username", "==", normalized),
    ),
  );

  if (snapshot.empty) {
    return null;
  }

  const record = snapshot.docs[0];
  return mapExtractionDoc(record.id, record.data());
}

async function deleteExtractionResultFirestore(id: string): Promise<void> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.instagram_extractions, id));
}

async function clearExtractionResultsFirestore(): Promise<number> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.instagram_extractions));

  if (snapshot.empty) {
    return 0;
  }

  let batch = writeBatch(db);
  let operationCount = 0;
  let deleted = 0;

  for (const record of snapshot.docs) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    batch.delete(record.ref);
    operationCount += 1;
    deleted += 1;
  }

  if (operationCount > 0) {
    await batch.commit();
  }

  return deleted;
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

export async function createExtractionResult(
  input: CreateInstagramExtractionInput,
): Promise<InstagramExtractionDocument> {
  return withFirestoreFallback(
    () => createExtractionResultFirestore(input),
    () => mockInstagramExtractionsStore.create(input),
  );
}

export async function createExtractionResultsBatch(
  inputs: CreateInstagramExtractionInput[],
): Promise<InstagramExtractionDocument[]> {
  if (inputs.length === 0) {
    return [];
  }

  return withFirestoreFallback(
    () => createExtractionResultsBatchFirestore(inputs),
    () => mockInstagramExtractionsStore.createBatch(inputs),
  );
}

export async function listExtractionResults(): Promise<InstagramExtractionDocument[]> {
  return withFirestoreFallback(
    () => listExtractionResultsFirestore(),
    () => mockInstagramExtractionsStore.list(),
  );
}

export async function findByUsername(
  username: string,
): Promise<InstagramExtractionDocument | null> {
  return withFirestoreFallback(
    () => findByUsernameFirestore(username),
    () => mockInstagramExtractionsStore.findByUsername(username),
  );
}

export async function deleteExtractionResult(id: string): Promise<boolean> {
  return withFirestoreFallback(
    async () => {
      await deleteExtractionResultFirestore(id);
      return true;
    },
    () => mockInstagramExtractionsStore.delete(id),
  );
}

export async function clearExtractionResults(): Promise<number> {
  return withFirestoreFallback(
    () => clearExtractionResultsFirestore(),
    () => mockInstagramExtractionsStore.clear(),
  );
}
