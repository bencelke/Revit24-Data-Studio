import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  writeBatch,
  type DocumentData,
} from "firebase/firestore";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { isoToTimestamp, timestampToIso } from "@/lib/firebase/timestamps";
import type {
  InstagramProfileImportJob,
  InstagramProfileImportRecord,
} from "@/lib/types/instagram-imports";

export class FirestoreNotConfiguredError extends Error {
  constructor() {
    super("Firebase is not configured. Set environment variables in .env.local.");
    this.name = "FirestoreNotConfiguredError";
  }
}

function getDb() {
  if (!isFirebaseConfigured()) {
    throw new FirestoreNotConfiguredError();
  }

  const db = getFirebaseFirestore();

  if (!db) {
    throw new FirestoreNotConfiguredError();
  }

  return db;
}

function mapJobDoc(id: string, data: DocumentData): InstagramProfileImportJob {
  return {
    id,
    name: String(data.name ?? ""),
    type: "instagram_profile_links",
    source: "instagram",
    status: data.status === "draft" ? "draft" : "queued",
    createdBy: String(data.createdBy ?? "system-dev"),
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
    totalRecords: Number(data.totalRecords ?? 0),
    validRecords: Number(data.validRecords ?? 0),
    duplicateRecords: Number(data.duplicateRecords ?? 0),
    invalidRecords: Number(data.invalidRecords ?? 0),
    notes: data.notes != null ? String(data.notes) : null,
  };
}

function mapRecordDoc(
  id: string,
  data: DocumentData,
): InstagramProfileImportRecord {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    originalInput: String(data.originalInput ?? ""),
    username: data.username != null ? String(data.username) : null,
    profileUrl: data.profileUrl != null ? String(data.profileUrl) : null,
    status: data.status as InstagramProfileImportRecord["status"],
    error: data.error != null ? String(data.error) : null,
    duplicateOf: data.duplicateOf != null ? String(data.duplicateOf) : null,
    createdAt: timestampToIso(data.createdAt),
    updatedAt: timestampToIso(data.updatedAt),
  };
}

export async function createInstagramProfileImportJob(
  job: Omit<InstagramProfileImportJob, "id">,
  records: Omit<InstagramProfileImportRecord, "id">[],
): Promise<string> {
  const db = getDb();
  const jobRef = doc(collection(db, FIRESTORE_COLLECTIONS.import_jobs));
  const now = isoToTimestamp(job.createdAt);
  const BATCH_LIMIT = 499;

  const jobData = {
    name: job.name,
    type: job.type,
    source: job.source,
    status: job.status,
    createdBy: job.createdBy,
    createdAt: now,
    updatedAt: now,
    totalRecords: job.totalRecords,
    validRecords: job.validRecords,
    duplicateRecords: job.duplicateRecords,
    invalidRecords: job.invalidRecords,
    notes: job.notes,
  };

  let batch = writeBatch(db);
  let operationCount = 0;

  batch.set(jobRef, jobData);
  operationCount += 1;

  for (const record of records) {
    if (operationCount >= BATCH_LIMIT) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
    }

    const recordRef = doc(collection(db, FIRESTORE_COLLECTIONS.import_records));
    batch.set(recordRef, {
      jobId: jobRef.id,
      originalInput: record.originalInput,
      username: record.username,
      profileUrl: record.profileUrl,
      status: record.status,
      error: record.error,
      duplicateOf: record.duplicateOf,
      createdAt: isoToTimestamp(record.createdAt),
      updatedAt: isoToTimestamp(record.updatedAt),
    });
    operationCount += 1;
  }

  await batch.commit();
  return jobRef.id;
}

export async function getInstagramProfileImportJob(
  jobId: string,
): Promise<InstagramProfileImportJob | null> {
  const db = getDb();
  const jobSnap = await getDoc(doc(db, FIRESTORE_COLLECTIONS.import_jobs, jobId));

  if (!jobSnap.exists()) {
    return null;
  }

  return mapJobDoc(jobSnap.id, jobSnap.data());
}

export async function listInstagramProfileImportJobs(): Promise<
  InstagramProfileImportJob[]
> {
  const db = getDb();
  const jobsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.import_jobs),
    orderBy("createdAt", "desc"),
  );
  const snapshot = await getDocs(jobsQuery);

  return snapshot.docs.map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()));
}

export async function listInstagramProfileImportRecords(
  jobId: string,
): Promise<InstagramProfileImportRecord[]> {
  const db = getDb();
  const recordsQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.import_records),
    where("jobId", "==", jobId),
  );
  const snapshot = await getDocs(recordsQuery);

  const records = snapshot.docs.map((recordDoc) =>
    mapRecordDoc(recordDoc.id, recordDoc.data()),
  );

  return records.sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );
}

export async function updateInstagramProfileImportJobStatus(
  jobId: string,
  status: InstagramProfileImportJob["status"],
): Promise<void> {
  const db = getDb();
  const batch = writeBatch(db);
  const jobRef = doc(db, FIRESTORE_COLLECTIONS.import_jobs, jobId);

  batch.update(jobRef, {
    status,
    updatedAt: isoToTimestamp(new Date().toISOString()),
  });

  await batch.commit();
}

export async function findExistingRecordsByUsernames(
  usernames: string[],
): Promise<Map<string, { id: string; username: string }>> {
  const db = getDb();
  const existing = new Map<string, { id: string; username: string }>();
  const unique = [...new Set(usernames.map((username) => username.toLowerCase()))];

  for (let index = 0; index < unique.length; index += 30) {
    const chunk = unique.slice(index, index + 30);
    const recordsQuery = query(
      collection(db, FIRESTORE_COLLECTIONS.import_records),
      where("username", "in", chunk),
    );
    const snapshot = await getDocs(recordsQuery);

    snapshot.docs.forEach((recordDoc) => {
      const data = recordDoc.data();
      const username = String(data.username ?? "").toLowerCase();

      if (username) {
        existing.set(username, { id: recordDoc.id, username: String(data.username) });
      }
    });
  }

  return existing;
}

export { isFirebaseConfigured };
