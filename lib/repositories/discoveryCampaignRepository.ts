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
  CreateDiscoveryCampaignInput,
  DiscoveryCampaignDocument,
  DiscoveryCampaignStatus,
  DiscoveryEntityType,
  DiscoveryProvider,
} from "@/lib/types/discovery-engine";

function mapCampaignDoc(id: string, data: DocumentData): DiscoveryCampaignDocument {
  return {
    id,
    name: String(data.name ?? ""),
    description: data.description != null ? String(data.description) : null,
    country: data.country != null ? String(data.country) : null,
    state: data.state != null ? String(data.state) : null,
    city: data.city != null ? String(data.city) : null,
    area: data.area != null ? String(data.area) : null,
    radius: data.radius != null ? Number(data.radius) : null,
    provider: (data.provider as DiscoveryProvider) ?? "manual",
    entityTypes: Array.isArray(data.entityTypes) ? data.entityTypes as DiscoveryEntityType[] : [],
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    hashtags: Array.isArray(data.hashtags) ? data.hashtags.map(String) : [],
    brands: Array.isArray(data.brands) ? data.brands.map(String) : [],
    vehicleTypes: Array.isArray(data.vehicleTypes) ? data.vehicleTypes.map(String) : [],
    languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
    status: (data.status as DiscoveryCampaignStatus) ?? "draft",
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    templateId: data.templateId != null ? String(data.templateId) : null,
    metadata: (data.metadata as Record<string, unknown>) ?? null,
  };
}

function buildPayload(input: CreateDiscoveryCampaignInput) {
  return {
    ...input,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
  };
}

export async function createDiscoveryCampaign(
  input: CreateDiscoveryCampaignInput,
): Promise<DiscoveryCampaignDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.discovery_campaigns));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapCampaignDoc(ref.id, payload);
}

export async function getDiscoveryCampaign(id: string): Promise<DiscoveryCampaignDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.discovery_campaigns, id));
  if (!snapshot.exists()) return null;
  return mapCampaignDoc(snapshot.id, snapshot.data());
}

export async function listDiscoveryCampaigns(): Promise<DiscoveryCampaignDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.discovery_campaigns));
  return snapshot.docs
    .map((docItem) => mapCampaignDoc(docItem.id, docItem.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateDiscoveryCampaign(
  id: string,
  data: Partial<CreateDiscoveryCampaignInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.updatedAt) updatePayload.updatedAt = isoToTimestamp(data.updatedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.discovery_campaigns, id), updatePayload);
}
