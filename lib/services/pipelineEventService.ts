import { mockPipelineStore } from "@/lib/mock-data/pipelineStore";
import {
  FirestoreNotConfiguredError,
  getErrorMessage,
} from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createPipelineEvent as persistPipelineEvent,
  listPipelineEventsByJobId as fetchPipelineEventsByJobId,
} from "@/lib/repositories/pipelineEventsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreatePipelineEventInput,
  PipelineEventDocument,
  PipelineStage,
  PipelineStatus,
} from "@/lib/types/pipeline";
import { seedPipelineMockDataIfEmpty } from "@/lib/mock-data/pipelineSeedData";

async function resolveDataMode(): Promise<"firestore" | "mock"> {
  if (isFirestoreAvailable()) return "firestore";
  seedPipelineMockDataIfEmpty();
  return "mock";
}

export async function logPipelineEvent(
  input: Omit<CreatePipelineEventInput, "timestamp"> & { timestamp?: string },
): Promise<PipelineEventDocument> {
  const payload: CreatePipelineEventInput = {
    ...input,
    timestamp: input.timestamp ?? new Date().toISOString(),
  };

  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await persistPipelineEvent(payload);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedPipelineMockDataIfEmpty();
        return mockPipelineStore.createEvent(payload);
      }
      throw error;
    }
  }

  return mockPipelineStore.createEvent(payload);
}

export async function getPipelineEventsForJob(
  jobId: string,
): Promise<PipelineEventDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchPipelineEventsByJobId(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedPipelineMockDataIfEmpty();
        return mockPipelineStore.listEventsByJobId(jobId);
      }
      throw error;
    }
  }

  return mockPipelineStore.listEventsByJobId(jobId);
}

export async function logStageTransition(params: {
  jobId: string;
  recordId?: string | null;
  stage: PipelineStage;
  status: PipelineStatus;
  message: string;
  duration?: number | null;
  worker?: string | null;
}): Promise<PipelineEventDocument> {
  return logPipelineEvent({
    jobId: params.jobId,
    recordId: params.recordId ?? null,
    stage: params.stage,
    status: params.status,
    message: params.message,
    duration: params.duration ?? null,
    worker: params.worker ?? null,
  });
}

export function getPipelineEventSummary(events: PipelineEventDocument[]): string {
  if (events.length === 0) return "No events recorded.";
  const latest = events[events.length - 1];
  return latest?.message ?? "Pipeline activity recorded.";
}

export function getFirebasePipelineWarning(): string | undefined {
  if (!isFirebaseConfigured()) {
    return "Firebase is not configured. Pipeline data is served from mock storage.";
  }
  return undefined;
}

export function safePipelineErrorMessage(error: unknown): string {
  return getErrorMessage(error);
}
