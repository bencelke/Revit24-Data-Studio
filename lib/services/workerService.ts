import { mockWorkerStore } from "@/lib/mock-data/workerStore";
import { seedWorkerLogsIfEmpty } from "@/lib/mock-data/queueSeedData";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import { listWorkerLogs as fetchWorkerLogs } from "@/lib/repositories/workerLogsRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  WorkerDocument,
  WorkerLogDocument,
  WorkerLogLevel,
  WorkerLogsFilterParams,
  WorkerLogsListResult,
  WorkerLogsPageData,
  WorkersPageData,
} from "@/lib/types/workers";

const DEFAULT_PAGE_SIZE = 20;

async function loadWorkerLogs(): Promise<WorkerLogDocument[]> {
  if (isFirestoreAvailable()) {
    try {
      return await fetchWorkerLogs(200);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedWorkerLogsIfEmpty();
        return mockWorkerStore.listWorkerLogs();
      }
      throw error;
    }
  }
  seedWorkerLogsIfEmpty();
  return mockWorkerStore.listWorkerLogs();
}

export function getWorkerStatusLabel(status: WorkerDocument["status"]): string {
  const labels: Record<WorkerDocument["status"], string> = {
    online: "Online",
    offline: "Offline",
    busy: "Busy",
    idle: "Idle",
    maintenance: "Maintenance",
  };
  return labels[status];
}

export function getWorkerLogLevelLabel(level: WorkerLogLevel): string {
  return level.charAt(0).toUpperCase() + level.slice(1);
}

export function applyWorkerLogsFilters(
  logs: WorkerLogDocument[],
  params: WorkerLogsFilterParams = {},
): WorkerLogsListResult {
  const page = params.page ?? 1;
  const pageSize = params.pageSize ?? DEFAULT_PAGE_SIZE;
  const search = params.search?.trim().toLowerCase() ?? "";

  const filtered = logs.filter((log) => {
    if (params.level && params.level !== "all" && log.level !== params.level) {
      return false;
    }
    if (params.workerId && params.workerId !== "all" && log.workerId !== params.workerId) {
      return false;
    }
    if (!search) return true;

    const haystack = [log.workerName, log.event, log.message, log.jobId]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();
    return haystack.includes(search);
  });

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    logs: filtered.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getWorkersPageData(): Promise<WorkersPageData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const { listLiveWorkers } = await import("@/lib/services/heartbeatService");
  const workers = await listLiveWorkers();

  return {
    workers,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
  };
}

export async function getWorkerLogsPageData(): Promise<WorkerLogsPageData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const logs = await loadWorkerLogs();

  return {
    logs,
    workers: await listLiveWorkers(),
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
  };
}

async function listLiveWorkers(): Promise<WorkerDocument[]> {
  const { listLiveWorkers: fetchLiveWorkers } = await import(
    "@/lib/services/heartbeatService"
  );
  return fetchLiveWorkers();
}

export async function listWorkerLogs(max = 100): Promise<WorkerLogDocument[]> {
  const logs = await loadWorkerLogs();
  return logs.slice(0, max);
}

export function formatWorkerDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  }).format(new Date(isoDate));
}

export function formatRelativeHeartbeat(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime();
  const seconds = Math.floor(diffMs / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export { MOCK_MODE_WARNING };
