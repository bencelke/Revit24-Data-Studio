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
import type { AppLogEntry, CreateAppLogInput } from "@/lib/types/import-jobs";

function mapLogDoc(id: string, data: DocumentData): AppLogEntry {
  return {
    id,
    timestamp: timestampToIso(data.timestamp),
    event: String(data.event ?? ""),
    user: String(data.user ?? "system-dev"),
    details:
      data.details != null && typeof data.details === "object"
        ? (data.details as Record<string, unknown>)
        : {},
    level: (data.level as AppLogEntry["level"]) ?? "info",
  };
}

export async function createAppLog(input: CreateAppLogInput): Promise<string> {
  const db = getFirestoreDb();
  const logRef = doc(collection(db, FIRESTORE_COLLECTIONS.logs));

  const payload = {
    timestamp: isoToTimestamp(input.timestamp),
    event: input.event,
    user: input.user,
    details: input.details,
    level: input.level,
  };

  await setDoc(logRef, payload);

  return logRef.id;
}

export async function listRecentAppLogs(max = 10): Promise<AppLogEntry[]> {
  const db = getFirestoreDb();
  const logsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.logs),
    orderBy("timestamp", "desc"),
    limit(max),
  );
  const snapshot = await getDocs(logsQuery);

  return snapshot.docs.map((logDoc) => mapLogDoc(logDoc.id, logDoc.data()));
}
