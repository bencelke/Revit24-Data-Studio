import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type { CreateSavedSearchInput, SavedSearchDocument } from "@/lib/types/google-places";

function mapSavedSearchDoc(id: string, data: DocumentData): SavedSearchDocument {
  return {
    id,
    name: String(data.name ?? ""),
    country: String(data.country ?? ""),
    state: String(data.state ?? ""),
    city: String(data.city ?? ""),
    area: String(data.area ?? ""),
    keyword: String(data.keyword ?? ""),
    category: String(data.category ?? ""),
    radius: Number(data.radius ?? 5000),
    createdBy: String(data.createdBy ?? "system-dev"),
    createdAt: timestampToIso(data.createdAt),
  };
}

export async function createSavedSearch(
  input: CreateSavedSearchInput,
): Promise<SavedSearchDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.saved_searches));
  const payload = {
    ...input,
    createdAt: isoToTimestamp(input.createdAt),
  };
  await setDoc(ref, payload);
  return mapSavedSearchDoc(ref.id, payload);
}

export async function listSavedSearches(): Promise<SavedSearchDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.saved_searches));
  return snapshot.docs
    .map((searchDoc) => mapSavedSearchDoc(searchDoc.id, searchDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function deleteSavedSearch(id: string): Promise<void> {
  const db = getFirestoreDb();
  await deleteDoc(doc(db, FIRESTORE_COLLECTIONS.saved_searches, id));
}

export async function updateSavedSearch(
  id: string,
  data: Partial<CreateSavedSearchInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.saved_searches, id), updatePayload);
}
