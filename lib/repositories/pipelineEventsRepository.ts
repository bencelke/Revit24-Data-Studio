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
  CreatePipelineEventInput,
  PipelineEventDocument,
  PipelineStage,
  PipelineStatus,
} from "@/lib/types/pipeline";

function mapEventDoc(id: string, data: DocumentData): PipelineEventDocument {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    recordId: data.recordId != null ? String(data.recordId) : null,
    stage: (data.stage as PipelineStage) ?? "import",
    status: (data.status as PipelineStatus) ?? "created",
    message: String(data.message ?? ""),
    duration: data.duration != null ? Number(data.duration) : null,
    worker: data.worker != null ? String(data.worker) : null,
    timestamp: timestampToIso(data.timestamp),
  };
}

export async function createPipelineEvent(
  input: CreatePipelineEventInput,
): Promise<PipelineEventDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.pipeline_events));
  const payload = {
    jobId: input.jobId,
    recordId: input.recordId,
    stage: input.stage,
    status: input.status,
    message: input.message,
    duration: input.duration,
    worker: input.worker,
    timestamp: isoToTimestamp(input.timestamp),
  };
  await setDoc(ref, payload);
  return mapEventDoc(ref.id, payload);
}

export async function listPipelineEventsByJobId(
  jobId: string,
): Promise<PipelineEventDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(
    query(
      collection(db, FIRESTORE_COLLECTIONS.pipeline_events),
      where("jobId", "==", jobId),
    ),
  );
  return snapshot.docs
    .map((eventDoc) => mapEventDoc(eventDoc.id, eventDoc.data()))
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
}

export async function listPipelineEvents(): Promise<PipelineEventDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.pipeline_events));
  return snapshot.docs
    .map((eventDoc) => mapEventDoc(eventDoc.id, eventDoc.data()))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}
