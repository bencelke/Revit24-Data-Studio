import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateDiscoveryTemplateInput,
  DiscoveryEntityType,
  DiscoveryProvider,
  DiscoveryTemplateDocument,
} from "@/lib/types/discovery-engine";

function mapTemplateDoc(id: string, data: DocumentData): DiscoveryTemplateDocument {
  return {
    id,
    name: String(data.name ?? ""),
    description: String(data.description ?? ""),
    provider: (data.provider as DiscoveryProvider) ?? "instagram",
    entityTypes: Array.isArray(data.entityTypes) ? data.entityTypes as DiscoveryEntityType[] : [],
    keywords: Array.isArray(data.keywords) ? data.keywords.map(String) : [],
    hashtags: Array.isArray(data.hashtags) ? data.hashtags.map(String) : [],
    brands: Array.isArray(data.brands) ? data.brands.map(String) : [],
    vehicleTypes: Array.isArray(data.vehicleTypes) ? data.vehicleTypes.map(String) : [],
    languages: Array.isArray(data.languages) ? data.languages.map(String) : [],
    category: String(data.category ?? "general"),
    isBuiltIn: Boolean(data.isBuiltIn),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function createDiscoveryTemplate(
  input: CreateDiscoveryTemplateInput,
): Promise<DiscoveryTemplateDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.discovery_templates));
  const payload = {
    ...input,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
  };
  await setDoc(ref, payload);
  return mapTemplateDoc(ref.id, payload);
}

export async function getDiscoveryTemplate(id: string): Promise<DiscoveryTemplateDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.discovery_templates, id));
  if (!snapshot.exists()) return null;
  return mapTemplateDoc(snapshot.id, snapshot.data());
}

export async function listDiscoveryTemplates(): Promise<DiscoveryTemplateDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.discovery_templates));
  return snapshot.docs
    .map((docItem) => mapTemplateDoc(docItem.id, docItem.data()))
    .sort((a, b) => a.name.localeCompare(b.name));
}
