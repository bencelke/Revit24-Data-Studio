import { mockWebsiteStore } from "@/lib/mock-data/websiteStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { createImportJob as persistImportJob } from "@/lib/repositories/importJobsRepository";
import { createImportRecords as persistImportRecords } from "@/lib/repositories/importRecordsRepository";
import { getWebsiteRaw as fetchWebsiteRaw, updateWebsiteRaw as persistUpdateWebsiteRaw } from "@/lib/repositories/websiteRawRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { createExtractionJobFromImportJob } from "@/lib/services/queueService";
import { normalizeWebsite } from "@/lib/services/websiteNormalizationService";
import { findWebsiteDuplicates } from "@/lib/services/websiteDuplicateService";
import type { WebsiteImportResult, WebsiteRawDocument } from "@/lib/types/websites";
import { createDefaultReviewFields } from "@/lib/types/review";
import { mockImportJobStore } from "@/lib/mock-data/importJobStore";

const WEBSITE_JOB_TYPE = "website_discovery";
const WEBSITE_SOURCE = "website";
const CREATED_BY = "system-dev";

async function getWebsite(id: string): Promise<WebsiteRawDocument | null> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchWebsiteRaw(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockWebsiteStore.getRaw(id);
      throw error;
    }
  }
  return mockWebsiteStore.getRaw(id);
}

async function updateWebsiteStatus(id: string, status: WebsiteRawDocument["status"]): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateWebsiteRaw(id, { status });
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockWebsiteStore.updateRaw(id, { status });
        return;
      }
      throw error;
    }
  }
  mockWebsiteStore.updateRaw(id, { status });
}

export async function importSelectedWebsites(
  websiteIds: string[],
  action: "import" | "queue" | "reject" | "duplicate" = "import",
): Promise<WebsiteImportResult> {
  const result: WebsiteImportResult = { imported: 0, queued: 0, rejected: 0, duplicates: 0, failed: 0 };
  if (websiteIds.length === 0) return result;

  const timestamp = new Date().toISOString();
  const valid: WebsiteRawDocument[] = [];

  for (const id of websiteIds) {
    const site = await getWebsite(id);
    if (!site) { result.failed += 1; continue; }

    if (action === "reject") {
      await updateWebsiteStatus(id, "rejected");
      result.rejected += 1;
      continue;
    }
    if (action === "duplicate") {
      await updateWebsiteStatus(id, "duplicate");
      result.duplicates += 1;
      continue;
    }

    const dupes = await findWebsiteDuplicates(site);
    if (dupes.some((m) => m.confidenceLevel === "high")) {
      await updateWebsiteStatus(id, "duplicate");
      result.duplicates += 1;
      continue;
    }
    valid.push(site);
  }

  if (valid.length === 0 || action === "reject" || action === "duplicate") return result;

  const jobInput = {
    name: `Website Import — ${valid.length} sites`,
    type: WEBSITE_JOB_TYPE,
    source: WEBSITE_SOURCE,
    status: "pending_review" as const,
    createdBy: CREATED_BY,
    createdAt: timestamp,
    updatedAt: timestamp,
    totalRecords: valid.length,
    validRecords: valid.length,
    duplicateRecords: 0,
    invalidRecords: 0,
    notes: "Imported from website discovery",
    metadata: { source: "website_discovery" },
  };

  let importJobId: string;

  const recordInputs = valid.map((site) => ({
    jobId: "",
    originalInput: site.url,
    username: site.domain,
    profileUrl: site.url,
    status: "valid" as const,
    error: null,
    duplicateOf: null,
    createdAt: timestamp,
    updatedAt: timestamp,
    ...createDefaultReviewFields("valid", WEBSITE_SOURCE),
    displayName: site.title,
    website: site.url,
    publicEmail: site.publicEmails[0]?.email ?? null,
    description: site.metaDescription,
    country: site.country,
    city: site.city,
  }));

  if (isFirestoreAvailable()) {
    try {
      const job = await persistImportJob(jobInput);
      importJobId = job.id;
      await persistImportRecords(recordInputs.map((r) => ({ ...r, jobId: job.id })));
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        const job = mockImportJobStore.createImportJob(jobInput);
        importJobId = job.id;
        mockImportJobStore.createImportRecords(recordInputs.map((r) => ({ ...r, jobId: job.id })));
      } else throw error;
    }
  } else {
    const job = mockImportJobStore.createImportJob(jobInput);
    importJobId = job.id;
    mockImportJobStore.createImportRecords(recordInputs.map((r) => ({ ...r, jobId: job.id })));
  }

  for (const site of valid) {
    try {
      await normalizeWebsite(site);
      await updateWebsiteStatus(site.id, action === "queue" ? "queued" : "imported");
      if (action === "queue") result.queued += 1;
      else result.imported += 1;
    } catch {
      result.failed += 1;
    }
  }

  if (action === "queue") {
    try { await createExtractionJobFromImportJob(importJobId!); } catch { /* best effort */ }
  }

  return result;
}
