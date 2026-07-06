import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type {
  CreatePublishQueueInput,
  PipelineProvider,
  PublishQueueDocument,
  PublishQueueStatus,
} from "@/lib/types/pipeline";

function mapPublishDoc(id: string, data: DocumentData): PublishQueueDocument {
  return {
    id,
    importRecordId: String(data.importRecordId ?? ""),
    approvedRecordId: data.approvedRecordId != null ? String(data.approvedRecordId) : null,
    pipelineJobId: data.pipelineJobId != null ? String(data.pipelineJobId) : null,
    provider: (data.provider as PipelineProvider) ?? "manual",
    status: (data.status as PublishQueueStatus) ?? "pending",
    displayName: data.displayName != null ? String(data.displayName) : null,
    importSource: String(data.importSource ?? ""),
    createdAt: timestampToIso(data.createdAt),
    publishedAt: data.publishedAt != null ? timestampToIso(data.publishedAt) : null,
    metadata: (data.metadata as Record<string, unknown>) ?? null,
  };
}

function buildPayload(input: CreatePublishQueueInput) {
  return {
    importRecordId: input.importRecordId,
    approvedRecordId: input.approvedRecordId,
    pipelineJobId: input.pipelineJobId,
    provider: input.provider,
    status: input.status,
    displayName: input.displayName,
    importSource: input.importSource,
    createdAt: isoToTimestamp(input.createdAt),
    publishedAt: input.publishedAt ? isoToTimestamp(input.publishedAt) : null,
    metadata: input.metadata,
  };
}

export async function createPublishQueueEntry(
  input: CreatePublishQueueInput,
): Promise<PublishQueueDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.publish_queue));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapPublishDoc(ref.id, payload);
}

export async function listPublishQueue(): Promise<PublishQueueDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.publish_queue));
  return snapshot.docs
    .map((publishDoc) => mapPublishDoc(publishDoc.id, publishDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePublishQueueEntry(
  id: string,
  data: Partial<CreatePublishQueueInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.publishedAt) updatePayload.publishedAt = isoToTimestamp(data.publishedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.publish_queue, id), updatePayload);
}
