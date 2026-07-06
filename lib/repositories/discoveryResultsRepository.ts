import {
  collection,
  doc,
  getDocs,
  query,
  setDoc,
  where,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateDiscoveryResultInput,
  DiscoveryConfidenceLevel,
  DiscoveryEntityType,
  DiscoveryProvider,
  DiscoveryResultDocument,
  DiscoveryResultStatus,
} from "@/lib/types/discovery-engine";

function mapResultDoc(id: string, data: DocumentData): DiscoveryResultDocument {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    campaignId: String(data.campaignId ?? ""),
    source: (data.source as DiscoveryProvider) ?? "manual",
    name: String(data.name ?? ""),
    url: String(data.url ?? ""),
    entityType: (data.entityType as DiscoveryEntityType) ?? "unknown",
    country: data.country != null ? String(data.country) : null,
    city: data.city != null ? String(data.city) : null,
    status: (data.status as DiscoveryResultStatus) ?? "new",
    confidence: (data.confidence as DiscoveryConfidenceLevel) ?? "medium",
    isDuplicate: Boolean(data.isDuplicate),
    isQueued: Boolean(data.isQueued),
    importRecordId: data.importRecordId != null ? String(data.importRecordId) : null,
    createdAt: timestampToIso(data.createdAt),
    metadata: (data.metadata as Record<string, unknown>) ?? null,
  };
}

export async function createDiscoveryResults(
  inputs: CreateDiscoveryResultInput[],
): Promise<DiscoveryResultDocument[]> {
  const db = getFirestoreDb();
  const results: DiscoveryResultDocument[] = [];

  for (const input of inputs) {
    const ref = doc(collection(db, FIRESTORE_COLLECTIONS.discovery_results));
    const payload = { ...input, createdAt: isoToTimestamp(input.createdAt) };
    await setDoc(ref, payload);
    results.push(mapResultDoc(ref.id, payload));
  }

  return results;
}

export async function listDiscoveryResults(): Promise<DiscoveryResultDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.discovery_results));
  return snapshot.docs
    .map((docItem) => mapResultDoc(docItem.id, docItem.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listDiscoveryResultsByJobId(
  jobId: string,
): Promise<DiscoveryResultDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.discovery_results),
      where("jobId", "==", jobId),
    ),
  );
  return snapshot.docs
    .map((docItem) => mapResultDoc(docItem.id, docItem.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listDiscoveryResultsByCampaignId(
  campaignId: string,
): Promise<DiscoveryResultDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.discovery_results),
      where("campaignId", "==", campaignId),
    ),
  );
  return snapshot.docs
    .map((docItem) => mapResultDoc(docItem.id, docItem.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}
