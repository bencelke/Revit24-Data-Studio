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
import type { WorkerDocument, WorkerStatus } from "@/lib/types/workers";

export type CreateWorkerInput = Omit<WorkerDocument, "id">;
export type UpdateWorkerInput = Partial<CreateWorkerInput>;

function mapWorkerDoc(id: string, data: DocumentData): WorkerDocument {
  return {
    id,
    name: String(data.name ?? "Worker"),
    hostname: String(data.hostname ?? "unknown"),
    machineName: String(data.machineName ?? data.machine ?? "Unknown Machine"),
    version: String(data.version ?? "0.0.0"),
    status: (data.status as WorkerStatus) ?? "offline",
    machine: String(data.machine ?? data.machineName ?? "Unknown Machine"),
    platform: String(data.platform ?? "unknown"),
    environment: String(data.environment ?? "development"),
    startedAt: timestampToIso(data.startedAt),
    lastHeartbeat: timestampToIso(data.lastHeartbeat),
    currentJob: data.currentJob != null ? String(data.currentJob) : null,
    jobsCompleted: Number(data.jobsCompleted ?? 0),
    jobsRunning: Number(data.jobsRunning ?? 0),
    cpuUsagePercent: data.cpuUsagePercent != null ? Number(data.cpuUsagePercent) : null,
    memoryUsagePercent:
      data.memoryUsagePercent != null ? Number(data.memoryUsagePercent) : null,
  };
}

function buildWorkerPayload(input: CreateWorkerInput) {
  return {
    name: input.name,
    hostname: input.hostname,
    machineName: input.machineName,
    version: input.version,
    status: input.status,
    machine: input.machine,
    platform: input.platform,
    environment: input.environment,
    startedAt: isoToTimestamp(input.startedAt),
    lastHeartbeat: isoToTimestamp(input.lastHeartbeat),
    currentJob: input.currentJob,
    jobsCompleted: input.jobsCompleted,
    jobsRunning: input.jobsRunning,
    cpuUsagePercent: input.cpuUsagePercent,
    memoryUsagePercent: input.memoryUsagePercent,
  };
}

export async function registerWorker(input: CreateWorkerInput): Promise<WorkerDocument> {
  const db = getFirestoreDb();
  const workerRef = doc(collection(db, FIRESTORE_COLLECTIONS.workers));
  const payload = buildWorkerPayload(input);
  await setDoc(workerRef, payload);
  return mapWorkerDoc(workerRef.id, payload);
}

export async function getWorker(id: string): Promise<WorkerDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.workers, id));
  if (!snapshot.exists()) return null;
  return mapWorkerDoc(snapshot.id, snapshot.data());
}

export async function listWorkers(): Promise<WorkerDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.workers));
  return snapshot.docs
    .map((workerDoc) => mapWorkerDoc(workerDoc.id, workerDoc.data()))
    .sort((a, b) => new Date(b.lastHeartbeat).getTime() - new Date(a.lastHeartbeat).getTime());
}

export async function updateWorker(id: string, data: UpdateWorkerInput): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };

  if (data.startedAt) updatePayload.startedAt = isoToTimestamp(data.startedAt);
  if (data.lastHeartbeat) updatePayload.lastHeartbeat = isoToTimestamp(data.lastHeartbeat);

  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.workers, id), updatePayload);
}

export async function upsertWorkerById(
  id: string,
  input: CreateWorkerInput,
): Promise<WorkerDocument> {
  const db = getFirestoreDb();
  const workerRef = doc(db, FIRESTORE_COLLECTIONS.workers, id);
  const payload = buildWorkerPayload(input);
  await setDoc(workerRef, payload, { merge: true });
  return mapWorkerDoc(id, payload);
}
