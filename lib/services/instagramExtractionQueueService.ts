import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  createQueueItemsBatch,
  findActiveQueueItemByUsername,
  listQueueItems,
} from "@/lib/repositories/instagramExtractionQueueRepository";
import { listExtractionResults } from "@/lib/repositories/instagramExtractionsRepository";
import type { InstagramEntityType, InstagramExtractionDocument } from "@/lib/types/instagramExtraction";
import { detectInstagramEntityType } from "@/lib/utils/instagramEntityType";
import type {
  CreateInstagramExtractionQueueInput,
  InstagramExtractionQueueDocument,
  InstagramQueueJobSummary,
  InstagramResultsSummary,
  InstagramResultsView,
  InstagramResultsViewRow,
} from "@/lib/types/instagramExtractionQueue";

function nowIso(): string {
  return new Date().toISOString();
}

function buildQueueInput(profile: {
  username: string;
  profileUrl: string;
}): CreateInstagramExtractionQueueInput {
  const timestamp = nowIso();
  return {
    username: profile.username.toLowerCase(),
    profileUrl: profile.profileUrl,
    status: "pending",
    createdAt: timestamp,
    updatedAt: timestamp,
    startedAt: null,
    completedAt: null,
    attempts: 0,
    errorCode: null,
    errorMessage: null,
  };
}

export async function enqueueInstagramProfiles(
  profiles: { username: string; profileUrl: string }[],
): Promise<{ records: InstagramExtractionQueueDocument[]; summary: InstagramQueueJobSummary }> {
  const storageMode = isFirestoreAvailable() ? "live" : "mock";
  const toCreate: CreateInstagramExtractionQueueInput[] = [];
  let skipped = 0;

  for (const profile of profiles) {
    const active = await findActiveQueueItemByUsername(profile.username);
    if (active) {
      skipped += 1;
      continue;
    }

    toCreate.push(buildQueueInput(profile));
  }

  const records = await createQueueItemsBatch(toCreate);

  return {
    records,
    summary: {
      queued: records.length,
      skipped,
      storageMode,
    },
  };
}

function mapExtractionStatus(status: InstagramExtractionDocument["status"]): string {
  if (status === "completed") return "success";
  if (status === "mock") return "success";
  return status;
}

function buildResultsSummary(rows: InstagramResultsViewRow[]): InstagramResultsSummary {
  const summary: InstagramResultsSummary = {
    pending: 0,
    running: 0,
    success: 0,
    failed: 0,
  };

  for (const row of rows) {
    if (row.status === "pending") {
      summary.pending += 1;
    } else if (row.status === "running") {
      summary.running += 1;
    } else if (row.status === "success" || row.status === "completed" || row.status === "mock") {
      summary.success += 1;
    } else if (row.status === "failed") {
      summary.failed += 1;
    }
  }

  return summary;
}

function resolveRowEntityType(
  extraction: InstagramExtractionDocument | undefined,
  username: string,
  displayName: string | null,
  bio: string | null,
): InstagramEntityType {
  if (extraction?.entityType) {
    return extraction.entityType;
  }

  return detectInstagramEntityType({ username, displayName, bio });
}

function mergeResultsView(
  queueItems: InstagramExtractionQueueDocument[],
  extractions: InstagramExtractionDocument[],
): InstagramResultsViewRow[] {
  const extractionByUsername = new Map(
    extractions.map((row) => [row.username.toLowerCase(), row]),
  );
  const seenUsernames = new Set<string>();
  const rows: InstagramResultsViewRow[] = [];

  for (const item of queueItems) {
    const key = item.username.toLowerCase();
    seenUsernames.add(key);
    const extraction = extractionByUsername.get(key);

    rows.push({
      id: item.id,
      rowType: "queue",
      queueId: item.id,
      extractionId: extraction?.id ?? null,
      username: item.username,
      profileUrl: item.profileUrl,
      profileImageUrl: extraction?.profileImageUrl ?? null,
      displayName: extraction?.displayName ?? null,
      publicEmail: extraction?.publicEmail ?? null,
      website: extraction?.website ?? null,
      bio: extraction?.bio ?? null,
      entityType: resolveRowEntityType(
        extraction,
        item.username,
        extraction?.displayName ?? null,
        extraction?.bio ?? null,
      ),
      status: extraction ? mapExtractionStatus(extraction.status) : item.status,
      errorCode: item.errorCode ?? extraction?.errorCode ?? null,
      errorMessage: item.errorMessage ?? extraction?.errorMessage ?? extraction?.error ?? null,
      extractedAt: extraction?.extractedAt ?? item.completedAt ?? null,
    });
  }

  for (const extraction of extractions) {
    const key = extraction.username.toLowerCase();
    if (seenUsernames.has(key)) {
      continue;
    }

    rows.push({
      id: extraction.id,
      rowType: "extraction",
      queueId: null,
      extractionId: extraction.id,
      username: extraction.username,
      profileUrl: extraction.profileUrl,
      profileImageUrl: extraction.profileImageUrl,
      displayName: extraction.displayName,
      publicEmail: extraction.publicEmail,
      website: extraction.website,
      bio: extraction.bio,
      entityType: extraction.entityType,
      status: mapExtractionStatus(extraction.status),
      errorCode: extraction.errorCode,
      errorMessage: extraction.errorMessage ?? extraction.error,
      extractedAt: extraction.extractedAt,
    });
  }

  return rows.sort((a, b) => {
    const aTime = a.extractedAt ? new Date(a.extractedAt).getTime() : 0;
    const bTime = b.extractedAt ? new Date(b.extractedAt).getTime() : 0;
    return bTime - aTime;
  });
}

export async function getInstagramResultsView(): Promise<InstagramResultsView> {
  const [queueItems, extractions] = await Promise.all([listQueueItems(), listExtractionResults()]);
  const rows = mergeResultsView(queueItems, extractions);

  return {
    summary: buildResultsSummary(rows),
    rows,
  };
}

export { mergeResultsView, buildResultsSummary };
