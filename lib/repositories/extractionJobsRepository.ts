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
  CreateExtractionJobInput,
  ExtractionJobDocument,
  ExtractionJobStatus,
  ExtractionPlatform,
  ExtractionPriority,
} from "@/lib/types/queue";

function mapJobDoc(id: string, data: DocumentData): ExtractionJobDocument {
  return {
    id,
    importJobId: String(data.importJobId ?? ""),
    name: String(data.name ?? ""),
    platform: (data.platform as ExtractionPlatform) ?? "instagram",
    status: (data.status as ExtractionJobStatus) ?? "waiting",
    priority: (data.priority as ExtractionPriority) ?? "normal",
    createdBy: String(data.createdBy ?? "system-dev"),
    createdAt: timestampToIso(data.createdAt),
    startedAt: data.startedAt ? timestampToIso(data.startedAt) : null,
    completedAt: data.completedAt ? timestampToIso(data.completedAt) : null,
    estimatedRecords: Number(data.estimatedRecords ?? 0),
    processedRecords: Number(data.processedRecords ?? 0),
    successfulRecords: Number(data.successfulRecords ?? 0),
    failedRecords: Number(data.failedRecords ?? 0),
    duplicateRecords: Number(data.duplicateRecords ?? 0),
    workerVersion: data.workerVersion != null ? String(data.workerVersion) : null,
    claimedByWorkerId:
      data.claimedByWorkerId != null ? String(data.claimedByWorkerId) : null,
    claimedAt: data.claimedAt ? timestampToIso(data.claimedAt) : null,
    notes: data.notes != null ? String(data.notes) : null,
  };
}

export async function createExtractionJob(
  input: CreateExtractionJobInput,
): Promise<ExtractionJobDocument> {
  const db = getFirestoreDb();
  const jobRef = doc(collection(db, FIRESTORE_COLLECTIONS.extraction_jobs));

  const payload = {
    importJobId: input.importJobId,
    name: input.name,
    platform: input.platform,
    status: input.status,
    priority: input.priority,
    createdBy: input.createdBy,
    createdAt: isoToTimestamp(input.createdAt),
    startedAt: input.startedAt ? isoToTimestamp(input.startedAt) : null,
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
    estimatedRecords: input.estimatedRecords,
    processedRecords: input.processedRecords,
    successfulRecords: input.successfulRecords,
    failedRecords: input.failedRecords,
    duplicateRecords: input.duplicateRecords,
    workerVersion: input.workerVersion,
    claimedByWorkerId: input.claimedByWorkerId,
    claimedAt: input.claimedAt ? isoToTimestamp(input.claimedAt) : null,
    notes: input.notes,
  };

  await setDoc(jobRef, payload);
  return mapJobDoc(jobRef.id, payload);
}

export async function getExtractionJob(id: string): Promise<ExtractionJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.extraction_jobs, id));
  if (!snapshot.exists()) return null;
  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listExtractionJobs(): Promise<ExtractionJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.extraction_jobs));

  return snapshot.docs
    .map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateExtractionJob(
  id: string,
  data: Partial<CreateExtractionJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };

  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.startedAt) updatePayload.startedAt = isoToTimestamp(data.startedAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);
  if (data.claimedAt) updatePayload.claimedAt = isoToTimestamp(data.claimedAt);

  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.extraction_jobs, id), updatePayload);
}

export async function getExtractionJobsByImportJobId(
  importJobId: string,
): Promise<ExtractionJobDocument[]> {
  const jobs = await listExtractionJobs();
  return jobs.filter((job) => job.importJobId === importJobId);
}

export async function claimExtractionJobTransaction(
  jobId: string,
  workerId: string,
): Promise<ExtractionJobDocument | null> {
  const db = getFirestoreDb();
  const jobRef = doc(db, FIRESTORE_COLLECTIONS.extraction_jobs, jobId);
  const { runTransaction } = await import("firebase/firestore");

  return runTransaction(db, async (transaction) => {
    const snapshot = await transaction.get(jobRef);
    if (!snapshot.exists()) return null;

    const data = snapshot.data();
    const status = data.status as ExtractionJobDocument["status"];
    if (status !== "queued" && status !== "retrying") return null;

    const claimedAt = new Date().toISOString();
    transaction.update(jobRef, {
      status: "running",
      claimedByWorkerId: workerId,
      claimedAt: isoToTimestamp(claimedAt),
      startedAt: data.startedAt ?? isoToTimestamp(claimedAt),
    });

    return mapJobDoc(jobId, {
      ...data,
      status: "running",
      claimedByWorkerId: workerId,
      claimedAt,
      startedAt: data.startedAt ?? claimedAt,
    });
  });
}
