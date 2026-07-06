import {
  collection,
  doc,
  getDoc,
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
  CreateInstagramProfileInput,
  InstagramProfileDocument,
  InstagramProfileStatus,
} from "@/lib/types/instagram-profiles";
import type { ExtractionErrorCode } from "@/lib/types/profile-extraction";

function mapProfileDoc(id: string, data: DocumentData): InstagramProfileDocument {
  return {
    id,
    username: String(data.username ?? ""),
    displayName: data.displayName != null ? String(data.displayName) : null,
    bio: data.bio != null ? String(data.bio) : null,
    profileImageUrl: data.profileImageUrl != null ? String(data.profileImageUrl) : null,
    profileUrl: String(data.profileUrl ?? ""),
    website: data.website != null ? String(data.website) : null,
    publicEmail: data.publicEmail != null ? String(data.publicEmail) : null,
    publicPhone: data.publicPhone != null ? String(data.publicPhone) : null,
    followers: data.followers != null ? Number(data.followers) : null,
    following: data.following != null ? Number(data.following) : null,
    posts: data.posts != null ? Number(data.posts) : null,
    verified: Boolean(data.verified),
    businessCategory: data.businessCategory != null ? String(data.businessCategory) : null,
    extractedAt: timestampToIso(data.extractedAt),
    extractionDurationMs: Number(data.extractionDurationMs ?? 0),
    workerVersion: String(data.workerVersion ?? ""),
    status: (data.status as InstagramProfileStatus) ?? "pending",
    errorCode: data.errorCode != null ? (data.errorCode as ExtractionErrorCode) : null,
    errorMessage: data.errorMessage != null ? String(data.errorMessage) : null,
    extractionJobId: data.extractionJobId != null ? String(data.extractionJobId) : null,
    extractionRecordId:
      data.extractionRecordId != null ? String(data.extractionRecordId) : null,
    importRecordId: data.importRecordId != null ? String(data.importRecordId) : null,
    rawJson:
      data.rawJson != null && typeof data.rawJson === "object"
        ? (data.rawJson as Record<string, unknown>)
        : null,
    isPrivate: Boolean(data.isPrivate ?? data.status === "private"),
    lastExtractedAt: timestampToIso(data.lastExtractedAt ?? data.extractedAt),
    sourceImportJobId:
      data.sourceImportJobId != null ? String(data.sourceImportJobId) : null,
    sourceImportRecordId:
      data.sourceImportRecordId != null
        ? String(data.sourceImportRecordId)
        : data.importRecordId != null
          ? String(data.importRecordId)
          : null,
    rawSafeMetadata:
      data.rawSafeMetadata != null && typeof data.rawSafeMetadata === "object"
        ? (data.rawSafeMetadata as Record<string, unknown>)
        : data.rawJson != null && typeof data.rawJson === "object"
          ? (data.rawJson as Record<string, unknown>)
          : null,
    createdAt: timestampToIso(data.createdAt ?? data.extractedAt),
    updatedAt: timestampToIso(data.updatedAt ?? data.extractedAt),
  };
}

function buildPayload(input: CreateInstagramProfileInput) {
  return {
    username: input.username,
    displayName: input.displayName,
    bio: input.bio,
    profileImageUrl: input.profileImageUrl,
    profileUrl: input.profileUrl,
    website: input.website,
    publicEmail: input.publicEmail,
    publicPhone: input.publicPhone,
    followers: input.followers,
    following: input.following,
    posts: input.posts,
    verified: input.verified,
    businessCategory: input.businessCategory,
    extractedAt: isoToTimestamp(input.extractedAt),
    extractionDurationMs: input.extractionDurationMs,
    workerVersion: input.workerVersion,
    status: input.status,
    errorCode: input.errorCode,
    errorMessage: input.errorMessage,
    extractionJobId: input.extractionJobId,
    extractionRecordId: input.extractionRecordId,
    importRecordId: input.importRecordId,
    rawJson: input.rawJson,
    isPrivate: input.isPrivate ?? input.status === "private",
    lastExtractedAt: isoToTimestamp(input.lastExtractedAt ?? input.extractedAt),
    sourceImportJobId: input.sourceImportJobId ?? null,
    sourceImportRecordId: input.sourceImportRecordId ?? input.importRecordId,
    rawSafeMetadata: input.rawSafeMetadata ?? input.rawJson,
    createdAt: isoToTimestamp(input.createdAt ?? input.extractedAt),
    updatedAt: isoToTimestamp(input.updatedAt ?? input.extractedAt),
  };
}

export async function upsertInstagramProfile(
  input: CreateInstagramProfileInput,
): Promise<InstagramProfileDocument> {
  const db = getFirestoreDb();
  const existing = await getInstagramProfileByUsername(input.username);

  const profileRef = existing
    ? doc(db, FIRESTORE_COLLECTIONS.instagram_profiles, existing.id)
    : doc(collection(db, FIRESTORE_COLLECTIONS.instagram_profiles));

  const payload = buildPayload(input);
  await setDoc(profileRef, payload, { merge: true });

  return mapProfileDoc(profileRef.id, payload);
}

export async function getInstagramProfileByUsername(
  username: string,
): Promise<InstagramProfileDocument | null> {
  const db = getFirestoreDb();
  const profilesQuery = query(
    collection(db, FIRESTORE_COLLECTIONS.instagram_profiles),
    where("username", "==", username),
  );
  const snapshot = await getDocs(profilesQuery);

  if (snapshot.empty) return null;
  const profileDoc = snapshot.docs[0];
  return mapProfileDoc(profileDoc.id, profileDoc.data());
}

export async function getInstagramProfile(id: string): Promise<InstagramProfileDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.instagram_profiles, id));
  if (!snapshot.exists()) return null;
  return mapProfileDoc(snapshot.id, snapshot.data());
}

export async function listInstagramProfiles(): Promise<InstagramProfileDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.instagram_profiles));

  return snapshot.docs
    .map((profileDoc) => mapProfileDoc(profileDoc.id, profileDoc.data()))
    .sort((a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime());
}
