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
  CreateNormalizedRecordInput,
  EntityType,
  NormalizationSource,
  NormalizedRecordDocument,
  NormalizedRecordStatus,
  SocialLinks,
} from "@/lib/types/normalization";

function mapRecordDoc(id: string, data: DocumentData): NormalizedRecordDocument {
  return {
    id,
    source: (data.source as NormalizationSource) ?? "instagram",
    sourceRecordId: String(data.sourceRecordId ?? ""),
    entityType: (data.entityType as EntityType) ?? "Unknown",
    displayName: String(data.displayName ?? ""),
    username: data.username != null ? String(data.username) : null,
    website: data.website != null ? String(data.website) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    publicPhone: data.publicPhone != null ? String(data.publicPhone) : null,
    country: data.country != null ? String(data.country) : null,
    state: data.state != null ? String(data.state) : null,
    city: data.city != null ? String(data.city) : null,
    area: data.area != null ? String(data.area) : null,
    address: data.address != null ? String(data.address) : null,
    latitude: data.latitude != null ? Number(data.latitude) : null,
    longitude: data.longitude != null ? Number(data.longitude) : null,
    description: data.description != null ? String(data.description) : null,
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    vehicleBrands: Array.isArray(data.vehicleBrands) ? data.vehicleBrands.map(String) : [],
    specialties: Array.isArray(data.specialties) ? data.specialties.map(String) : [],
    socialLinks:
      data.socialLinks != null && typeof data.socialLinks === "object"
        ? (data.socialLinks as SocialLinks)
        : {},
    status: (data.status as NormalizedRecordStatus) ?? "pending_review",
    confidenceScore: Number(data.confidenceScore ?? 0),
    normalizedAt: timestampToIso(data.normalizedAt),
    workerVersion: String(data.workerVersion ?? ""),
  };
}

function buildPayload(input: CreateNormalizedRecordInput) {
  return {
    source: input.source,
    sourceRecordId: input.sourceRecordId,
    entityType: input.entityType,
    displayName: input.displayName,
    username: input.username,
    website: input.website,
    publicEmail: input.publicEmail,
    publicPhone: input.publicPhone,
    country: input.country,
    state: input.state,
    city: input.city,
    area: input.area,
    address: input.address,
    latitude: input.latitude,
    longitude: input.longitude,
    description: input.description,
    tags: input.tags,
    vehicleBrands: input.vehicleBrands,
    specialties: input.specialties,
    socialLinks: input.socialLinks,
    status: input.status,
    confidenceScore: input.confidenceScore,
    normalizedAt: isoToTimestamp(input.normalizedAt),
    workerVersion: input.workerVersion,
  };
}

export async function upsertNormalizedRecord(
  input: CreateNormalizedRecordInput,
): Promise<NormalizedRecordDocument> {
  const db = getFirestoreDb();
  const existing = await getNormalizedRecordBySourceId(input.sourceRecordId);
  const recordRef = existing
    ? doc(db, FIRESTORE_COLLECTIONS.normalized_records, existing.id)
    : doc(collection(db, FIRESTORE_COLLECTIONS.normalized_records));

  const payload = buildPayload(input);
  await setDoc(recordRef, payload, { merge: true });
  return mapRecordDoc(recordRef.id, payload);
}

export async function getNormalizedRecord(id: string): Promise<NormalizedRecordDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.normalized_records, id));
  if (!snapshot.exists()) return null;
  return mapRecordDoc(snapshot.id, snapshot.data());
}

export async function getNormalizedRecordBySourceId(
  sourceRecordId: string,
): Promise<NormalizedRecordDocument | null> {
  const records = await listNormalizedRecords();
  return records.find((record) => record.sourceRecordId === sourceRecordId) ?? null;
}

export async function listNormalizedRecords(): Promise<NormalizedRecordDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.normalized_records));
  return snapshot.docs
    .map((recordDoc) => mapRecordDoc(recordDoc.id, recordDoc.data()))
    .sort((a, b) => new Date(b.normalizedAt).getTime() - new Date(a.normalizedAt).getTime());
}

export async function updateNormalizedRecord(
  id: string,
  data: Partial<CreateNormalizedRecordInput>,
): Promise<NormalizedRecordDocument | null> {
  const db = getFirestoreDb();
  const existing = await getNormalizedRecord(id);
  if (!existing) return null;

  const merged = { ...existing, ...data, id };
  const payload = buildPayload(merged);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.normalized_records, id), payload);
  return mapRecordDoc(id, payload);
}
