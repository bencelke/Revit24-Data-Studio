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
  CreateWebsiteRawInput,
  WebsiteRawDocument,
  WebsiteRawStatus,
} from "@/lib/types/websites";

function mapRawDoc(id: string, data: DocumentData): WebsiteRawDocument {
  return {
    id,
    jobId: String(data.jobId ?? ""),
    url: String(data.url ?? ""),
    domain: String(data.domain ?? ""),
    title: String(data.title ?? ""),
    metaDescription: data.metaDescription != null ? String(data.metaDescription) : null,
    logoUrl: data.logoUrl != null ? String(data.logoUrl) : null,
    faviconUrl: data.faviconUrl != null ? String(data.faviconUrl) : null,
    publicEmails: Array.isArray(data.publicEmails) ? data.publicEmails : [],
    publicPhones: Array.isArray(data.publicPhones) ? data.publicPhones : [],
    address: data.address != null ? String(data.address) : null,
    country: data.country != null ? String(data.country) : null,
    state: data.state != null ? String(data.state) : null,
    city: data.city != null ? String(data.city) : null,
    postalCode: data.postalCode != null ? String(data.postalCode) : null,
    socialLinks: (data.socialLinks as WebsiteRawDocument["socialLinks"]) ?? {},
    contactPage: data.contactPage != null ? String(data.contactPage) : null,
    aboutPage: data.aboutPage != null ? String(data.aboutPage) : null,
    privacyPage: data.privacyPage != null ? String(data.privacyPage) : null,
    businessHours: Array.isArray(data.businessHours) ? data.businessHours.map(String) : [],
    detectedLanguage: data.detectedLanguage != null ? String(data.detectedLanguage) : null,
    detectedBusinessType: data.detectedBusinessType ?? null,
    googleMapsUrl: data.googleMapsUrl != null ? String(data.googleMapsUrl) : null,
    status: (data.status as WebsiteRawStatus) ?? "discovered",
    source: "website",
    createdAt: timestampToIso(data.createdAt),
  };
}

function buildPayload(input: CreateWebsiteRawInput) {
  return {
    jobId: input.jobId,
    url: input.url,
    domain: input.domain,
    title: input.title,
    metaDescription: input.metaDescription,
    logoUrl: input.logoUrl,
    faviconUrl: input.faviconUrl,
    publicEmails: input.publicEmails,
    publicPhones: input.publicPhones,
    address: input.address,
    country: input.country,
    state: input.state,
    city: input.city,
    postalCode: input.postalCode,
    socialLinks: input.socialLinks,
    contactPage: input.contactPage,
    aboutPage: input.aboutPage,
    privacyPage: input.privacyPage,
    businessHours: input.businessHours,
    detectedLanguage: input.detectedLanguage,
    detectedBusinessType: input.detectedBusinessType,
    googleMapsUrl: input.googleMapsUrl,
    status: input.status,
    source: input.source,
    createdAt: isoToTimestamp(input.createdAt),
  };
}

export async function upsertWebsiteRaw(
  input: CreateWebsiteRawInput,
): Promise<WebsiteRawDocument> {
  const db = getFirestoreDb();
  const existing = (await listWebsiteRaw()).find(
    (site) => site.url === input.url || site.domain === input.domain,
  );

  if (existing) {
    await updateDoc(
      doc(db, FIRESTORE_COLLECTIONS.website_raw, existing.id),
      buildPayload(input),
    );
    return { ...input, id: existing.id };
  }

  const ref = doc(collection(db, FIRESTORE_COLLECTIONS.website_raw));
  const payload = buildPayload(input);
  await setDoc(ref, payload);
  return mapRawDoc(ref.id, payload);
}

export async function getWebsiteRaw(id: string): Promise<WebsiteRawDocument | null> {
  const db = getFirestoreDb();
  const snapshot = await getDoc(doc(db, FIRESTORE_COLLECTIONS.website_raw, id));
  if (!snapshot.exists()) return null;
  return mapRawDoc(snapshot.id, snapshot.data());
}

export async function listWebsiteRaw(): Promise<WebsiteRawDocument[]> {
  const db = getFirestoreDb();
  const snapshot = await getDocs(collection(db, FIRESTORE_COLLECTIONS.website_raw));
  return snapshot.docs
    .map((rawDoc) => mapRawDoc(rawDoc.id, rawDoc.data()))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function listWebsiteRawByJobId(jobId: string): Promise<WebsiteRawDocument[]> {
  const sites = await listWebsiteRaw();
  return sites.filter((site) => site.jobId === jobId);
}

export async function updateWebsiteRaw(
  id: string,
  data: Partial<CreateWebsiteRawInput>,
): Promise<void> {
  const db = getFirestoreDb();
  const updatePayload: Record<string, unknown> = { ...data };
  if (data.createdAt) updatePayload.createdAt = isoToTimestamp(data.createdAt);
  await updateDoc(doc(db, FIRESTORE_COLLECTIONS.website_raw, id), updatePayload);
}
