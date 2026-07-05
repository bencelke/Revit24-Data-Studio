import { mockWebsiteStore } from "@/lib/mock-data/websiteStore";
import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { listWebsiteRaw as fetchWebsiteRaw } from "@/lib/repositories/websiteRawRepository";
import { listNormalizedRecords as fetchNormalizedRecords } from "@/lib/repositories/normalizedRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type { WebsiteDuplicateMatch, WebsiteRawDocument } from "@/lib/types/websites";
import type { NormalizedRecordDocument } from "@/lib/types/normalization";
import { parseDomain } from "@/lib/services/websiteDiscoveryService";

function normalize(value: string | null | undefined): string {
  return (value ?? "").trim().toLowerCase();
}

function resolveLevel(score: number): WebsiteDuplicateMatch["confidenceLevel"] {
  if (score >= 70) return "high";
  if (score >= 45) return "medium";
  if (score >= 25) return "low";
  return "possible";
}

async function loadWebsites(): Promise<WebsiteRawDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchWebsiteRaw();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockWebsiteStore.listRaw();
      throw error;
    }
  }
  return mockWebsiteStore.listRaw();
}

async function loadNormalized(): Promise<NormalizedRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchNormalizedRecords();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockNormalizationStore.listRecords();
      throw error;
    }
  }
  return mockNormalizationStore.listRecords();
}

function compareWebsites(a: WebsiteRawDocument, b: WebsiteRawDocument): WebsiteDuplicateMatch | null {
  if (a.id === b.id) return null;
  const fields: string[] = [];
  let score = 0;

  if (normalize(a.url) === normalize(b.url)) { fields.push("website"); score += 40; }
  if (normalize(a.domain) === normalize(b.domain)) { fields.push("domain"); score += 35; }
  if (a.publicEmails[0] && b.publicEmails[0] && normalize(a.publicEmails[0].email) === normalize(b.publicEmails[0].email)) {
    fields.push("publicEmail"); score += 25;
  }
  if (a.publicPhones[0] && b.publicPhones[0] && normalize(a.publicPhones[0].phone) === normalize(b.publicPhones[0].phone)) {
    fields.push("phone"); score += 25;
  }
  if (normalize(a.title) === normalize(b.title) && normalize(a.city) === normalize(b.city)) {
    fields.push("businessName"); fields.push("city"); score += 20;
  }

  if (fields.length === 0) return null;
  return {
    matchedId: b.id,
    matchedName: b.title,
    matchFields: fields,
    confidenceScore: Math.min(100, score),
    confidenceLevel: resolveLevel(score),
    matchedSource: "website_raw",
  };
}

function compareToNormalized(site: WebsiteRawDocument, record: NormalizedRecordDocument): WebsiteDuplicateMatch | null {
  const fields: string[] = [];
  let score = 0;

  if (normalize(site.url) === normalize(record.website)) { fields.push("website"); score += 40; }
  if (normalize(site.domain) === normalize(record.username)) { fields.push("domain"); score += 30; }
  if (site.publicEmails[0] && normalize(site.publicEmails[0].email) === normalize(record.publicEmail)) {
    fields.push("publicEmail"); score += 25;
  }
  if (site.publicPhones[0] && normalize(site.publicPhones[0].phone) === normalize(record.publicPhone)) {
    fields.push("phone"); score += 25;
  }
  if (normalize(site.title) === normalize(record.displayName)) { fields.push("businessName"); score += 15; }

  if (fields.length === 0) return null;
  return {
    matchedId: record.id,
    matchedName: record.displayName,
    matchFields: fields,
    confidenceScore: Math.min(100, score),
    confidenceLevel: resolveLevel(score),
    matchedSource: "normalized_records",
  };
}

export async function findWebsiteDuplicates(site: WebsiteRawDocument): Promise<WebsiteDuplicateMatch[]> {
  const [websites, normalized] = await Promise.all([loadWebsites(), loadNormalized()]);
  const matches: WebsiteDuplicateMatch[] = [];

  for (const candidate of websites) {
    const match = compareWebsites(site, candidate);
    if (match) matches.push(match);
  }
  for (const record of normalized) {
    const match = compareToNormalized(site, record);
    if (match) matches.push(match);
  }

  return matches.sort((a, b) => b.confidenceScore - a.confidenceScore).slice(0, 5);
}

export { parseDomain };
