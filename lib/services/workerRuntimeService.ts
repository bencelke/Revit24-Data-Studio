import { mockQueueStore } from "@/lib/mock-data/queueStore";
import { seedQueueMockDataIfEmpty } from "@/lib/mock-data/queueSeedData";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  listExtractionJobs as fetchExtractionJobs,
  getExtractionJob as fetchExtractionJob,
} from "@/lib/repositories/extractionJobsRepository";
import { listExtractionRecords as fetchExtractionRecords } from "@/lib/repositories/extractionRecordsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import { listLiveWorkers } from "@/lib/services/heartbeatService";
import { buildLiveJobProgress } from "@/lib/services/progressService";
import type { LiveJobProgress } from "@/lib/types/runtime";
import type { ExtractionJobDocument, ExtractionRecordDocument } from "@/lib/types/queue";
import type { WorkerDocument } from "@/lib/types/workers";
import {
  getWorkerRuntimeState,
  initializeWorkerRuntime,
  runWorkerRuntimeCycle,
  startWorkerRuntimeLoop,
} from "@/workers/runtime/workerRuntime";

export interface WorkersRuntimePageData {
  workers: WorkerDocument[];
  liveJobs: LiveJobProgress[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
  warning?: string;
}

async function loadJobs(): Promise<ExtractionJobDocument[]> {
  seedQueueMockDataIfEmpty();

  if (isFirestoreAvailable()) {
    try {
      return await fetchExtractionJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockQueueStore.listExtractionJobs();
      }
      throw error;
    }
  }
  return mockQueueStore.listExtractionJobs();
}

async function loadRecords(jobId: string): Promise<ExtractionRecordDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchExtractionRecords(jobId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockQueueStore.listExtractionRecords(jobId);
      }
      throw error;
    }
  }
  return mockQueueStore.listExtractionRecords(jobId);
}

export async function getWorkersRuntimePageData(): Promise<WorkersRuntimePageData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const workers = await listLiveWorkers();
  const jobs = await loadJobs();

  const activeJobs = jobs.filter((job) =>
    ["queued", "running", "retrying"].includes(job.status),
  );

  const liveJobs: LiveJobProgress[] = [];
  for (const job of activeJobs.slice(0, 10)) {
    const records = await loadRecords(job.id);
    liveJobs.push(buildLiveJobProgress(job, records));
  }

  return {
    workers,
    liveJobs,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    warning: useFirestore ? undefined : MOCK_MODE_WARNING,
  };
}

export async function getLiveQueueProgress(): Promise<LiveJobProgress[]> {
  const jobs = await loadJobs();
  const activeJobs = jobs.filter((job) =>
    ["queued", "running", "retrying", "paused"].includes(job.status),
  );

  const liveJobs: LiveJobProgress[] = [];
  for (const job of activeJobs) {
    const records = await loadRecords(job.id);
    liveJobs.push(buildLiveJobProgress(job, records));
  }

  return liveJobs;
}

export async function getLiveJobProgress(jobId: string): Promise<LiveJobProgress | null> {
  let job: ExtractionJobDocument | null;

  if (isFirestoreAvailable()) {
    try {
      job = await fetchExtractionJob(jobId);
    } catch {
      job = mockQueueStore.getExtractionJob(jobId);
    }
  } else {
    job = mockQueueStore.getExtractionJob(jobId);
  }

  if (!job) return null;

  const records = await loadRecords(jobId);
  return buildLiveJobProgress(job, records);
}

export {
  getWorkerRuntimeState,
  initializeWorkerRuntime,
  runWorkerRuntimeCycle,
  startWorkerRuntimeLoop,
};

export type { LiveJobProgress } from "@/lib/types/runtime";
