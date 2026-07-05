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
  CreatePlacesSearchJobInput,
  PlacesSearchJobDocument,
  PlacesSearchJobStatus,
  PlacesSearchQuery,
} from "@/lib/types/google-places";

function mapJobDoc(id: string, data: DocumentData): PlacesSearchJobDocument {
  return {
    id,
    status: (data.status as PlacesSearchJobStatus) ?? "pending",
    query: (data.query as PlacesSearchQuery) ?? {
      country: "",
      state: "",
      city: "",
      area: "",
      keyword: "",
      category: "",
      radius: 5000,
    },
    createdBy: String(data.createdBy ?? "system-dev"),
    createdAt: timestampToIso(data.createdAt),
    completedAt: data.completedAt ? timestampToIso(data.completedAt) : null,
    totalResults: Number(data.totalResults ?? 0),
    importedResults: Number(data.importedResults ?? 0),
    failedResults: Number(data.failedResults ?? 0),
  };
}

export async function createPlacesSearchJob(
  input: CreatePlacesSearchJobInput,
): Promise<PlacesSearchJobDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.places_search_jobs));
  const payload = {
    status: input.status,
    query: input.query,
    createdBy: input.createdBy,
    createdAt: isoToTimestamp(input.createdAt),
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
    totalResults: input.totalResults ?? 0,
    importedResults: input.importedResults ?? 0,
    failedResults: input.failedResults ?? 0,
  };
  await setDoc(ref, payload);
  return mapJobDoc(ref.id, payload);
}

export async function getPlacesSearchJob(id: string): Promise<PlacesSearchJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.places_search_jobs, id));
  if (!snapshot.exists()) return null;
  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listPlacesSearchJobs(): Promise<PlacesSearchJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.places_search_jobs));
  return snapshot.docs
    .map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePlacesSearchJob(
  id: string,
  data: Partial<CreatePlacesSearchJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.places_search_jobs, id), updatePayload);
}
