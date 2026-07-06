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
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreateDiscoveryJobInput,
  DiscoveryJobDocument,
  DiscoveryJobStatus,
  DiscoveryProvider,
} from "@/lib/types/discovery-engine";

function mapJobDoc(id: string, data: DocumentData): DiscoveryJobDocument {
  return {
    id,
    campaignId: String(data.campaignId ?? ""),
    campaignName: String(data.campaignName ?? ""),
    provider: (data.provider as DiscoveryProvider) ?? "manual",
    status: (data.status as DiscoveryJobStatus) ?? "created",
    progress: Number(data.progress ?? 0),
    totalResults: Number(data.totalResults ?? 0),
    processedResults: Number(data.processedResults ?? 0),
    importedResults: Number(data.importedResults ?? 0),
    duplicateResults: Number(data.duplicateResults ?? 0),
    failedResults: Number(data.failedResults ?? 0),
    importJobId: data.importJobId != null ? String(data.importJobId) : null,
    pipelineJobId: data.pipelineJobId != null ? String(data.pipelineJobId) : null,
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    startedAt: data.startedAt != null ? timestampToIso(data.startedAt) : null,
    completedAt: data.completedAt != null ? timestampToIso(data.completedAt) : null,
    durationMs: data.durationMs != null ? Number(data.durationMs) : null,
    errorMessage: data.errorMessage != null ? String(data.errorMessage) : null,
    metadata: (data.metadata as Record<string, unknown>) ?? null,
  };
}

function buildPayload(input: CreateDiscoveryJobInput) {
  return {
    ...input,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    startedAt: input.startedAt ? isoToTimestamp(input.startedAt) : null,
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
  };
}

export async function createDiscoveryJob(
  input: CreateDiscoveryJobInput,
): Promise<DiscoveryJobDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.discovery_jobs));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapJobDoc(ref.id, payload);
}

export async function getDiscoveryJob(id: string): Promise<DiscoveryJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.discovery_jobs, id));
  if (!snapshot.exists()) return null;
  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listDiscoveryJobs(): Promise<DiscoveryJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.discovery_jobs));
  return snapshot.docs
    .map((docItem) => mapJobDoc(docItem.id, docItem.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listDiscoveryJobsByCampaignId(
  campaignId: string,
): Promise<DiscoveryJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.discovery_jobs),
      where("campaignId", "==", campaignId),
    ),
  );
  return snapshot.docs
    .map((docItem) => mapJobDoc(docItem.id, docItem.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateDiscoveryJob(
  id: string,
  data: Partial<CreateDiscoveryJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.updatedAt) updatePayload.updatedAt = isoToTimestamp(data.updatedAt);
  if (data.startedAt) updatePayload.startedAt = isoToTimestamp(data.startedAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.discovery_jobs, id), updatePayload);
}
