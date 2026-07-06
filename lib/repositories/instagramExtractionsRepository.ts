import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  query,
  setDoc,
  updateDoc,
  where,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { mockInstagramExtractionsStore } from "@/lib/mock-data/instagramExtractionsStore";
import { getFirestoreDb, isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { detectInstagramEntityType } from "@/lib/utils/instagramEntityType";
import type {
  CreateInstagramExtractionInput,
  ExtractionStatus,
  InstagramEntityType,
  InstagramExtractionDocument,
} from "@/lib/types/instagramExtraction";

const BATCH_LIMIT = 499;

function resolveEntityType(
  data: DocumentData,
  username: string,
  displayName: string | null,
  bio: string | null,
): InstagramEntityType {
  if (data.entityType === "club" || data.entityType === "member" || data.entityType === "unknown") {
    return data.entityType;
  }

  return detectInstagramEntityType({ username, displayName, bio });
}

function mapExtractionDoc(id: string, data: DocumentData): InstagramExtractionDocument {
  const username = String(data.username ?? "");
  const displayName = data.displayName != null ? String(data.displayName) : null;
  const bio = data.bio != null ? String(data.bio) : null;

  return {
    id,
    source: "instagram",
    entityType: resolveEntityType(data, username, displayName, bio),
    username,
    profileUrl: String(data.profileUrl ?? ""),
    profileImageUrl: data.profileImageUrl != null ? String(data.profileImageUrl) : null,
    displayName,
    bio,
    website: data.website != null ? String(data.website) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    status: (data.status as ExtractionStatus) ?? "completed",
    error: data.error != null ? String(data.error) : null,
    errorCode: data.errorCode != null ? String(data.errorCode) : null,
    errorMessage:
      data.errorMessage != null
        ? String(data.errorMessage)
        : data.error != null
          ? String(data.error)
          : null,
    extractedAt: timestampToIso(data.extractedAt),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

function buildPayload(input: CreateInstagramExtractionInput) {
  return {
    source: input.source,
    entityType: input.entityType,
    username: input.username,
    profileUrl: input.profileUrl,
    profileImageUrl: input.profileImageUrl,
    displayName: input.displayName,
    bio: input.bio,
    website: input.website,
    publicEmail: input.publicEmail,
    status: input.status,
    error: input.error,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage ?? input.error,
    extractedAt: isoToTimestamp(input.extractedAt),
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
  };
}

async function upsertExtractionResultFirestore(
  input: CreateInstagramExtractionInput,
): Promise<{ record: InstagramExtractionDocument; updated: boolean }> {
  const existing = await findByUsernameFirestore(input.username);

  if (existing) {
    const db = getFirestoreDb();
    const ref = doc(db, FIRESTORE_COLLECTIONS.instagram_extractions, existing.id);
    const updatePayload = {
      source: input.source,
      entityType: input.entityType,
      username: input.username,
      profileUrl: input.profileUrl,
      profileImageUrl: input.profileImageUrl,
      displayName: input.displayName,
      bio: input.bio,
      website: input.website,
      publicEmail: input.publicEmail,
      status: input.status,
      error: input.error,
      errorCode: input.errorCode,
      errorMessage: input.errorMessage ?? input.error,
      extractedAt: isoToTimestamp(input.extractedAt),
      updatedAt: isoToTimestamp(input.updatedAt),
    };
    await updateDoc(ref, updatePayload);
    return {
      record: {
        ...existing,
        ...input,
        id: existing.id,
        createdAt: existing.createdAt,
      },
      updated: true,
    };
  }

  const record = await createExtractionResultFirestore(input);
  return { record, updated: false };
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

export async function upsertExtractionResult(
  input: CreateInstagramExtractionInput,
): Promise<{ record: InstagramExtractionDocument; updated: boolean }> {
  return withFirestoreFallback(
    () => upsertExtractionResultFirestore(input),
    () => mockInstagramExtractionsStore.upsert(input),
  );
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
