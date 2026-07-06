import {
  getInstagramWorkerBatchSize,
  getInstagramWorkerDelayMs,
  getInstagramWorkerMaxRetries,
} from "@/lib/config/instagramWorker";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { instagramPublicProfileProvider } from "@/lib/providers/instagram";
import { normalizeExtractorErrorCode } from "@/lib/providers/instagram/instagramPublicProfileErrors";
import {
  findPendingQueueItems,
  updateQueueItem,
} from "@/lib/repositories/instagramExtractionQueueRepository";
import { upsertExtractionResult } from "@/lib/repositories/instagramExtractionsRepository";
import type { CreateInstagramExtractionInput } from "@/lib/types/instagramExtraction";
import type { InstagramExtractionQueueDocument } from "@/lib/types/instagramExtractionQueue";

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function nowIso(): string {
  return new Date().toISOString();
}

function log(message: string): void {
  console.log(message);
}

function toExtractionInput(params: {
  username: string;
  profileUrl: string;
  profileImageUrl: string | null;
  displayName: string | null;
  bio: string | null;
  website: string | null;
  publicEmail: string | null;
  status: "completed" | "failed";
  errorCode: string | null;
  errorMessage: string | null;
  extractedAt: string;
  createdAt?: string;
}): CreateInstagramExtractionInput {
  const timestamp = nowIso();
  return {
    source: "instagram",
    username: params.username.toLowerCase(),
    profileUrl: params.profileUrl,
    profileImageUrl: params.profileImageUrl,
    displayName: params.displayName,
    bio: params.bio,
    website: params.website,
    publicEmail: params.publicEmail,
    status: params.status,
    error: params.errorMessage,
    errorCode: params.errorCode,
    errorMessage: params.errorMessage,
    extractedAt: params.extractedAt,
    createdAt: params.createdAt ?? timestamp,
    updatedAt: timestamp,
  };
}

async function markQueueRunning(item: InstagramExtractionQueueDocument): Promise<void> {
  const timestamp = nowIso();
  await updateQueueItem(item.id, {
    status: "running",
    startedAt: timestamp,
    updatedAt: timestamp,
    attempts: item.attempts + 1,
  });
}

async function markQueueSuccess(item: InstagramExtractionQueueDocument): Promise<void> {
  const timestamp = nowIso();
  await updateQueueItem(item.id, {
    status: "success",
    completedAt: timestamp,
    updatedAt: timestamp,
    errorCode: null,
    errorMessage: null,
  });
}

async function markQueueFailed(
  item: InstagramExtractionQueueDocument,
  errorCode: string,
  errorMessage: string,
): Promise<void> {
  const timestamp = nowIso();
  await updateQueueItem(item.id, {
    status: "failed",
    completedAt: timestamp,
    updatedAt: timestamp,
    errorCode,
    errorMessage,
  });
}

export async function processQueueItem(
  item: InstagramExtractionQueueDocument,
): Promise<"success" | "failed"> {
  log(`Processing ${item.username}...`);

  await markQueueRunning(item);

  const providerResult = await instagramPublicProfileProvider.extractProfile(item.profileUrl);
  const extractedAt = providerResult.data?.extractedAt ?? nowIso();
  const httpStatus = providerResult.diagnostics.httpStatus;

  log(`Fetch status: ${httpStatus ?? "unknown"}`);

  if (providerResult.success && providerResult.data) {
    log("Metadata found: true");
    await upsertExtractionResult(
      toExtractionInput({
        username: providerResult.data.username,
        profileUrl: providerResult.data.profileUrl,
        profileImageUrl: providerResult.data.profileImageUrl,
        displayName: providerResult.data.displayName,
        bio: providerResult.data.bio,
        website: providerResult.data.website,
        publicEmail: providerResult.data.publicEmail,
        status: "completed",
        errorCode: null,
        errorMessage: null,
        extractedAt,
      }),
    );
    await markQueueSuccess(item);
    log(`Success: ${item.username}`);
    return "success";
  }

  const errorCode = normalizeExtractorErrorCode(providerResult.errorCode);
  const errorMessage = providerResult.error ?? "Extraction failed.";

  log("Metadata found: false");
  log(`Failed: ${errorCode}`);

  await upsertExtractionResult(
    toExtractionInput({
      username: item.username,
      profileUrl: item.profileUrl,
      profileImageUrl: null,
      displayName: null,
      bio: null,
      website: null,
      publicEmail: null,
      status: "failed",
      errorCode,
      errorMessage,
      extractedAt,
    }),
  );
  await markQueueFailed(item, errorCode, errorMessage);
  return "failed";
}

export interface InstagramWorkerRunSummary {
  processed: number;
  succeeded: number;
  failed: number;
  remaining: number;
}

export async function runInstagramWorkerCycle(): Promise<InstagramWorkerRunSummary> {
  if (!isFirebaseConfigured()) {
    throw new Error(
      "Firebase is not configured. Set NEXT_PUBLIC_FIREBASE_* env vars in .env.local.",
    );
  }

  const batchSize = getInstagramWorkerBatchSize();
  const delayMs = getInstagramWorkerDelayMs();
  const maxRetries = getInstagramWorkerMaxRetries();

  let processed = 0;
  let succeeded = 0;
  let failed = 0;

  const pending = await findPendingQueueItems(batchSize);
  log(`Profiles found: ${pending.length}`);

  for (let index = 0; index < pending.length; index += 1) {
    const item = pending[index];

    if (item.attempts >= maxRetries + 1) {
      await markQueueFailed(item, "unknown_error", "Maximum retry attempts reached.");
      failed += 1;
      processed += 1;
      continue;
    }

    const result = await processQueueItem(item);
    processed += 1;
    if (result === "success") {
      succeeded += 1;
    } else {
      failed += 1;
    }

    if (index < pending.length - 1 && delayMs > 0) {
      await sleep(delayMs);
    }
  }

  const remaining = (await findPendingQueueItems(batchSize)).length;
  log(`Total processed: ${processed} (${succeeded} succeeded, ${failed} failed). Remaining: ${remaining}`);

  return { processed, succeeded, failed, remaining };
}

export async function runInstagramWorkerUntilEmpty(): Promise<InstagramWorkerRunSummary> {
  const totals: InstagramWorkerRunSummary = {
    processed: 0,
    succeeded: 0,
    failed: 0,
    remaining: 0,
  };

  while (true) {
    const cycle = await runInstagramWorkerCycle();
    totals.processed += cycle.processed;
    totals.succeeded += cycle.succeeded;
    totals.failed += cycle.failed;
    totals.remaining = cycle.remaining;

    if (cycle.processed === 0 || cycle.remaining === 0) {
      break;
    }
  }

  return totals;
}
