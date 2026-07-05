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
  CreateGooglePlaceRawInput,
  GooglePlaceRawDocument,
  GooglePlaceStatus,
} from "@/lib/types/google-places";

function mapPlaceDoc(id: string, data: DocumentData): GooglePlaceRawDocument {
  return {
    id,
    placeId: String(data.placeId ?? ""),
    name: String(data.name ?? ""),
    businessCategory: String(data.businessCategory ?? ""),
    rating: data.rating != null ? Number(data.rating) : null,
    reviewCount: data.reviewCount != null ? Number(data.reviewCount) : null,
    formattedAddress: String(data.formattedAddress ?? ""),
    country: String(data.country ?? ""),
    state: String(data.state ?? ""),
    city: String(data.city ?? ""),
    area: String(data.area ?? ""),
    postalCode: data.postalCode != null ? String(data.postalCode) : null,
    latitude: Number(data.latitude ?? 0),
    longitude: Number(data.longitude ?? 0),
    phone: data.phone != null ? String(data.phone) : null,
    website: data.website != null ? String(data.website) : null,
    googleMapsUrl: String(data.googleMapsUrl ?? ""),
    openingHours: Array.isArray(data.openingHours) ? data.openingHours.map(String) : [],
    photos: Array.isArray(data.photos) ? data.photos.map(String) : [],
    status: (data.status as GooglePlaceStatus) ?? "discovered",
    source: "google_places",
    searchJobId: data.searchJobId != null ? String(data.searchJobId) : null,
    createdAt: timestampToIso(data.createdAt),
  };
}

function buildPayload(input: CreateGooglePlaceRawInput) {
  return {
    placeId: input.placeId,
    name: input.name,
    businessCategory: input.businessCategory,
    rating: input.rating,
    reviewCount: input.reviewCount,
    formattedAddress: input.formattedAddress,
    country: input.country,
    state: input.state,
    city: input.city,
    area: input.area,
    postalCode: input.postalCode,
    latitude: input.latitude,
    longitude: input.longitude,
    phone: input.phone,
    website: input.website,
    googleMapsUrl: input.googleMapsUrl,
    openingHours: input.openingHours,
    photos: input.photos,
    status: input.status,
    source: input.source,
    searchJobId: input.searchJobId,
    createdAt: isoToTimestamp(input.createdAt),
  };
}

export async function upsertGooglePlace(
  input: CreateGooglePlaceRawInput,
): Promise<GooglePlaceRawDocument> {
  const db = getFirestoreDb();
  const existing = await listGooglePlaces();
  const match = existing.find((place) => place.placeId === input.placeId);

  if (match) {
    await updateDoc(doc(db, FIRESTORE_COLLECTIONS.google_places_raw, match.id), buildPayload(input));
    return { ...input, id: match.id };
  }

  const placeRef = doc(collection(db, FIRESTORE_COLLECTIONS.google_places_raw));
  const payload = buildPayload(input);
  await setDoc(placeRef, payload);
  return mapPlaceDoc(placeRef.id, payload);
}

export async function createGooglePlaces(
  inputs: CreateGooglePlaceRawInput[],
): Promise<GooglePlaceRawDocument[]> {
  const results: GooglePlaceRawDocument[] = [];
  for (const input of inputs) {
    results.push(await upsertGooglePlace(input));
  }
  return results;
}

export async function getGooglePlace(id: string): Promise<GooglePlaceRawDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.google_places_raw, id));
  if (!snapshot.exists()) return null;
  return mapPlaceDoc(snapshot.id, snapshot.data());
}

export async function getGooglePlaceByPlaceId(
  placeId: string,
): Promise<GooglePlaceRawDocument | null> {
  const places = await listGooglePlaces();
  return places.find((place) => place.placeId === placeId) ?? null;
}

export async function listGooglePlaces(): Promise<GooglePlaceRawDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.google_places_raw));
  return snapshot.docs
    .map((placeDoc) => mapPlaceDoc(placeDoc.id, placeDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listGooglePlacesByJobId(
  jobId: string,
): Promise<GooglePlaceRawDocument[]> {
  const places = await listGooglePlaces();
  return places.filter((place) => place.searchJobId === jobId);
}

export async function updateGooglePlace(
  id: string,
  data: Partial<CreateGooglePlaceRawInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.google_places_raw, id), updatePayload);
}
