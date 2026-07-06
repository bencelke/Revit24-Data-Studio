import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateInstagramExtractionQueueInput,
  InstagramExtractionQueueDocument,
} from "@/lib/types/instagramExtractionQueue";

export const LOCAL_QUEUE_STORAGE_KEY = "revit24_instagram_extraction_queue";

function sortByCreatedAt(rows: InstagramExtractionQueueDocument[]): InstagramExtractionQueueDocument[] {
  return [...rows].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

function readLocalQueue(): InstagramExtractionQueueDocument[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LOCAL_QUEUE_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as InstagramExtractionQueueDocument[];
  } catch {
    return [];
  }
}

function writeLocalQueue(rows: InstagramExtractionQueueDocument[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_QUEUE_STORAGE_KEY, JSON.stringify(sortByCreatedAt(rows)));
}

function generateId(): string {
  return `ig_queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function listQueueItemsSync(): InstagramExtractionQueueDocument[] {
  return readLocalQueue();
}

export function saveQueueItems(items: InstagramExtractionQueueDocument[]): void {
  if (isFirestoreAvailable() || typeof window === "undefined") {
    return;
  }

  const rows = readLocalQueue();
  writeLocalQueue([...items, ...rows]);
}

export function createLocalQueueItems(
  inputs: CreateInstagramExtractionQueueInput[],
): InstagramExtractionQueueDocument[] {
  return inputs.map((input) => ({
    ...input,
    id: generateId(),
  }));
}

export function usesLocalQueueStorage(): boolean {
  return !isFirestoreAvailable();
}
