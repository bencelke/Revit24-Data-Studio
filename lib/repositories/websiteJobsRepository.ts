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
  CreateWebsiteJobInput,
  WebsiteJobDocument,
  WebsiteJobStatus,
} from "@/lib/types/websites";

function mapJobDoc(id: string, data: DocumentData): WebsiteJobDocument {
  return {
    id,
    status: (data.status as WebsiteJobStatus) ?? "pending",
    inputType: (data.inputType as WebsiteJobDocument["inputType"]) ?? "bulk",
    urls: Array.isArray(data.urls) ? data.urls.map(String) : [],
    createdBy: String(data.createdBy ?? "system-dev"),
    createdAt: timestampToIso(data.createdAt),
    startedAt: data.startedAt ? timestampToIso(data.startedAt) : null,
    completedAt: data.completedAt ? timestampToIso(data.completedAt) : null,
    totalUrls: Number(data.totalUrls ?? 0),
    processedUrls: Number(data.processedUrls ?? 0),
    successfulUrls: Number(data.successfulUrls ?? 0),
    failedUrls: Number(data.failedUrls ?? 0),
    respectRobotsTxt: Boolean(data.respectRobotsTxt ?? true),
  };
}

export async function createWebsiteJob(
  input: CreateWebsiteJobInput,
): Promise<WebsiteJobDocument> {
  const db = getFirestoreDb();
  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.website_jobs));
  const payload = {
    status: input.status,
    inputType: input.inputType,
    urls: input.urls,
    createdBy: input.createdBy,
    createdAt: isoToTimestamp(input.createdAt),
    startedAt: input.startedAt ? isoToTimestamp(input.startedAt) : null,
    completedAt: input.completedAt ? isoToTimestamp(input.completedAt) : null,
    totalUrls: input.totalUrls,
    processedUrls: input.processedUrls,
    successfulUrls: input.successfulUrls,
    failedUrls: input.failedUrls,
    respectRobotsTxt: input.respectRobotsTxt,
  };
  await setDoc(ref, payload);
  return mapJobDoc(ref.id, payload);
}

export async function getWebsiteJob(id: string): Promise<WebsiteJobDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.website_jobs, id));
  if (!snapshot.exists()) return null;
  return mapJobDoc(snapshot.id, snapshot.data());
}

export async function listWebsiteJobs(): Promise<WebsiteJobDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.website_jobs));
  return snapshot.docs
    .map((jobDoc) => mapJobDoc(jobDoc.id, jobDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function updateWebsiteJob(
  id: string,
  data: Partial<CreateWebsiteJobInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  if (data.startedAt) updatePayload.startedAt = isoToTimestamp(data.startedAt);
  if (data.completedAt) updatePayload.completedAt = isoToTimestamp(data.completedAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.website_jobs, id), updatePayload);
}
