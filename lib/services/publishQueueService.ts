import { mockPipelineStore } from "@/lib/mock-data/pipelineStore";
import { seedPipelineMockDataIfEmpty } from "@/lib/mock-data/pipelineSeedData";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import {
  createPublishQueueEntry,
  listPublishQueue,
  updatePublishQueueEntry,
} from "@/lib/repositories/publishQueueRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreatePublishQueueInput,
  PipelineProvider,
  PublishQueueDocument,
} from "@/lib/types/pipeline";
import { advancePipelineStage, getPipelineJobById } from "@/lib/services/pipelineService";
import { logStageTransition } from "@/lib/services/pipelineEventService";

async function resolveDataMode(): Promise<"firestore" | "mock"> {
  if (isFirestoreAvailable()) return "firestore";
  seedPipelineMockDataIfEmpty();
  return "mock";
}

function mapImportSourceToProvider(importSource: string): PipelineProvider {
  const normalized = importSource.toLowerCase();
  if (normalized.includes("instagram")) return "instagram";
  if (normalized.includes("google") || normalized.includes("places")) return "google_places";
  if (normalized.includes("website")) return "website";
  if (normalized.includes("csv")) return "csv";
  if (normalized.includes("api")) return "api";
  return "manual";
}

export async function enqueueFromApproval(input: {
  importRecordId: string;
  approvedRecordId?: string | null;
  pipelineJobId?: string | null;
  importSource: string;
  displayName?: string | null;
  metadata?: Record<string, unknown> | null;
}): Promise<PublishQueueDocument> {
  const now = new Date().toISOString();
  const provider = mapImportSourceToProvider(input.importSource);

  const payload: CreatePublishQueueInput = {
    importRecordId: input.importRecordId,
    approvedRecordId: input.approvedRecordId ?? null,
    pipelineJobId: input.pipelineJobId ?? null,
    provider,
    status: "pending",
    displayName: input.displayName ?? null,
    importSource: input.importSource,
    createdAt: now,
    publishedAt: null,
    metadata: input.metadata ?? null,
  };

  const mode = await resolveDataMode();
  let entry: PublishQueueDocument;

  if (mode === "firestore") {
    try {
      entry = await createPublishQueueEntry(payload);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        entry = mockPipelineStore.createPublishEntry(payload);
      } else {
        throw error;
      }
    }
  } else {
    entry = mockPipelineStore.createPublishEntry(payload);
  }

  if (input.pipelineJobId) {
    const job = await getPipelineJobById(input.pipelineJobId);
    if (job) {
      await advancePipelineStage(input.pipelineJobId, {
        stage: "publish",
        status: "ready_to_publish",
        message: `Record ${input.importRecordId} queued for publish.`,
        recordId: input.importRecordId,
      });
    }
  }

  return entry;
}

export async function listPublishQueueEntries(): Promise<PublishQueueDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await listPublishQueue();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedPipelineMockDataIfEmpty();
        return mockPipelineStore.listPublish();
      }
      throw error;
    }
  }
  return mockPipelineStore.listPublish();
}

export async function markPublishQueueReady(id: string): Promise<PublishQueueDocument | null> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      await updatePublishQueueEntry(id, { status: "ready" });
      const entries = await listPublishQueue();
      return entries.find((entry) => entry.id === id) ?? null;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockPipelineStore.updatePublish(id, { status: "ready" });
      }
      throw error;
    }
  }
  return mockPipelineStore.updatePublish(id, { status: "ready" });
}

export async function markPublishQueuePublished(
  id: string,
  pipelineJobId?: string | null,
): Promise<PublishQueueDocument | null> {
  const now = new Date().toISOString();
  const mode = await resolveDataMode();

  let entry: PublishQueueDocument | null;
  if (mode === "firestore") {
    try {
      await updatePublishQueueEntry(id, { status: "published", publishedAt: now });
      const entries = await listPublishQueue();
      entry = entries.find((item) => item.id === id) ?? null;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        entry = mockPipelineStore.updatePublish(id, { status: "published", publishedAt: now });
      } else {
        throw error;
      }
    }
  } else {
    entry = mockPipelineStore.updatePublish(id, { status: "published", publishedAt: now });
  }

  if (pipelineJobId && entry) {
    await advancePipelineStage(pipelineJobId, {
      stage: "publish",
      status: "published",
      message: `Publish queue entry ${id} marked published.`,
    });
    await logStageTransition({
      jobId: pipelineJobId,
      recordId: entry.importRecordId,
      stage: "publish",
      status: "published",
      message: "Record published to downstream consumer queue.",
    });
  }

  return entry;
}
