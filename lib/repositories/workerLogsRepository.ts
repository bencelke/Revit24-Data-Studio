import {
  collection,
  doc,
  getDocs,
  setDoc,
  query,
  orderBy,
  limit,
  type DocumentData,
} from "firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import { getFirestoreDb } from "@/lib/repositories/firestore-client";
import type { CreateWorkerLogInput, WorkerLogDocument, WorkerLogLevel } from "@/lib/types/workers";

function mapLogDoc(id: string, data: DocumentData): WorkerLogDocument {
  return {
    id,
    timestamp: timestampToIso(data.timestamp),
    workerId: String(data.workerId ?? ""),
    workerName: String(data.workerName ?? ""),
    level: (data.level as WorkerLogLevel) ?? "info",
    event: String(data.event ?? ""),
    jobId: data.jobId != null ? String(data.jobId) : null,
    message: String(data.message ?? ""),
  };
}

export async function createWorkerLog(input: CreateWorkerLogInput): Promise<WorkerLogDocument> {
  const db = getFirestoreDb();
  const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.worker_logs));

  const payload = {
    timestamp: isoToTimestamp(input.timestamp),
    workerId: input.workerId,
    workerName: input.workerName,
    level: input.level,
    event: input.event,
    jobId: input.jobId,
    message: input.message,
  };

  await setDoc(logRef, payload);
  return mapLogDoc(logRef.id, payload);
}

export async function listWorkerLogs(max = 100): Promise<WorkerLogDocument[]> {
  const db = getFirestoreDb();
  const logsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.worker_logs),
    orderBy("timestamp", "desc"),
    limit(max),
  );
  const snapshot = await getDocs(logsQuery);

  return snapshot.docs.map((logDoc) => mapLogDoc(logDoc.id, logDoc.data()));
}
