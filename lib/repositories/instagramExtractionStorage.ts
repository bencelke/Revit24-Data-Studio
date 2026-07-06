import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  clearExtractionResults as clearFirestoreExtractionResults,
  deleteExtractionResult as deleteFirestoreExtractionResult,
  listExtractionResults as listFirestoreExtractionResults,
  upsertExtractionResult as upsertFirestoreExtractionResult,
} from "@/lib/repositories/instagramExtractionsRepository";
import type {
  CreateInstagramExtractionInput,
  ExtractedInstagramProfile,
  InstagramExtractionDocument,
} from "@/lib/types/instagramExtraction";

export const LOCAL_STORAGE_KEY = "revit24_instagram_extractions";

const extractionResultListeners = new Set<() => void>();

function notifyExtractionResultsChanged(): void {
  for (const listener of extractionResultListeners) {
    listener();
  }
}

export function subscribeToExtractionResults(onStoreChange: () => void): () => void {
  extractionResultListeners.add(onStoreChange);

  if (typeof window !== "undefined") {
    const onStorage = (event: StorageEvent) => {
      if (event.key === LOCAL_STORAGE_KEY || event.key === null) {
        onStoreChange();
      }
    };
    window.addEventListener("storage", onStorage);

    return () => {
      extractionResultListeners.delete(onStoreChange);
      window.removeEventListener("storage", onStorage);
    };
  }

  return () => {
    extractionResultListeners.delete(onStoreChange);
  };
}

function sortByExtractedAt(rows: ExtractedInstagramProfile[]): ExtractedInstagramProfile[] {
  return [...rows].sort(
    (a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime(),
  );
}

function readLocalStorage(): ExtractedInstagramProfile[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    return JSON.parse(raw) as ExtractedInstagramProfile[];
  } catch {
    return [];
  }
}

function writeLocalStorage(rows: ExtractedInstagramProfile[]): void {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(sortByExtractedAt(rows)));
  notifyExtractionResultsChanged();
}

function upsertLocalRecord(record: ExtractedInstagramProfile): { record: ExtractedInstagramProfile; updated: boolean } {
  const rows = readLocalStorage();
  const key = record.username.toLowerCase();
  const index = rows.findIndex((row) => row.username.toLowerCase() === key);

  if (index >= 0) {
    const updatedRecord: ExtractedInstagramProfile = {
      ...record,
      id: rows[index].id,
      createdAt: rows[index].createdAt,
    };
    rows[index] = updatedRecord;
    writeLocalStorage(rows);
    return { record: updatedRecord, updated: true };
  }

  rows.push(record);
  writeLocalStorage(rows);
  return { record, updated: false };
}

export function saveExtractionResults(results: ExtractedInstagramProfile[]): void {
  if (isFirestoreAvailable() || typeof window === "undefined") {
    return;
  }

  const rows = readLocalStorage();
  const next = [...rows];

  for (const result of results) {
    const key = result.username.toLowerCase();
    const index = next.findIndex((row) => row.username.toLowerCase() === key);
    if (index >= 0) {
      next[index] = {
        ...result,
        id: next[index].id,
        createdAt: next[index].createdAt,
      };
    } else {
      next.push(result);
    }
  }

  writeLocalStorage(next);
}

export async function listExtractionResults(): Promise<ExtractedInstagramProfile[]> {
  if (isFirestoreAvailable()) {
    return listFirestoreExtractionResults();
  }

  return readLocalStorage();
}

export function listExtractionResultsSync(): ExtractedInstagramProfile[] {
  if (isFirestoreAvailable() || typeof window === "undefined") {
    return [];
  }

  return readLocalStorage();
}

export async function upsertExtractionResult(
  input: CreateInstagramExtractionInput,
): Promise<{ record: InstagramExtractionDocument; updated: boolean }> {
  if (isFirestoreAvailable()) {
    return upsertFirestoreExtractionResult(input);
  }

  const record: InstagramExtractionDocument = {
    ...input,
    id: `ig_ext_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
  };

  if (typeof window === "undefined") {
    return { record, updated: false };
  }

  return upsertLocalRecord(record);
}

export async function deleteExtractionResult(id: string): Promise<boolean> {
  if (isFirestoreAvailable()) {
    return deleteFirestoreExtractionResult(id);
  }

  if (typeof window === "undefined") {
    return false;
  }

  const rows = readLocalStorage();
  const next = rows.filter((row) => row.id !== id);
  if (next.length === rows.length) {
    return false;
  }

  writeLocalStorage(next);
  return true;
}

export async function clearExtractionResults(): Promise<number> {
  if (isFirestoreAvailable()) {
    return clearFirestoreExtractionResults();
  }

  if (typeof window === "undefined") {
    return 0;
  }

  const count = readLocalStorage().length;
  window.localStorage.removeItem(LOCAL_STORAGE_KEY);
  notifyExtractionResultsChanged();
  return count;
}

export function usesLocalStorage(): boolean {
  return !isFirestoreAvailable();
}
