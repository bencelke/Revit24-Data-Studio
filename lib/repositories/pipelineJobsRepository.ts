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
  CreatePipelineJobInput,
  PipelineJobDocument,
  PipelineProvider,
  PipelineStage,
  PipelineStageProgress,
  PipelineStatus,
} from "@/lib/types/pipeline";

function mapJobDoc(id: string, data: DocumentData): PipelineJobDocument {
  return {
    id,
    provider: (data.provider as PipelineProvider) ?? "manual",
    status: (data.status as PipelineStatus) ?? "created",
    currentStage: (data.currentStage as PipelineStage) ?? "import",
    progress: Number(data.progress ?? 0),
    totalRecords: Number(data.totalRecords ?? 0),
    processedRecords: Number(data.processedRecords ?? 0),
    successfulRecords: Number(data.successfulRecords ?? 0),
    failedRecords: Number(data.failedRecords ?? 0),
    createdBy: String(data.createdBy ?? ""),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    completedAt: data.completedAt != null ? timestampToIso(data.completedAt) : null,
    importJobId: data.importJobId != null ? String(data.importJobId) : null,
    extractionJobId: data.extractionJobId != null ? String(data.extractionJobId) : null,
    sourceJobId: data.sourceJobId != null ? String(data.sourceJobId) : null,
    stageProgress: Array.isArray(data.stageProgress) ? data.stageProgress as PipelineStageProgress[] : [],
    metadata: (data.metadata as Record<string, unknown>) ?? null,
  };
}

function buildPayload(input: CreatePipelineJobInput) {
  return {
    provider: input.provider,
    status: input.status,
    currentStage: input.currentStage,
    progress: input.progress,
    totalRecords: input.totalRecords,
    processedRecords: input.processedRecords,
    successfulRecords: input.successfulRecords,
    failedRecords: input.failedRecords,
    createdBy: input.createdBy,
    createdAt: isoToTimestamp(input.createdAt),
    updatedAt: isoToTimestamp(input.updatedAt),
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
    importJobId: input.importJobId,
    extractionJobId: input.extractionJobId,
    sourceJobId: input.sourceJobId,
    stageProgress: input.stageProgress,
    metadata: input.metadata,
  };
}

export async function createPipelineJob(
  input: CreatePipelineJobInput,
): Promise<PipelineJobDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.pipeline_jobs));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapJobDoc(ref.id, payload);
}

export async function getPipelineJob(id: string): Promise<PipelineJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.pipeline_jobs, id));
  if (!snapshot.exists()) return null;
  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listPipelineJobs(): Promise<PipelineJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.pipeline_jobs));
  return snapshot.docs
    .map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updatePipelineJob(
  id: string,
  data: Partial<CreatePipelineJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.updatedAt) updatePayload.updatedAt = isoToTimestamp(data.updatedAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.pipeline_jobs, id), updatePayload);
}
