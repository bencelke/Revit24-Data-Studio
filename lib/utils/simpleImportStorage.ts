import type { SimpleExtractedProfile } from "@/lib/types/simpleInstagramImport";

const STORAGE_KEY = "revit24_simple_import_results";

export function saveSimpleImportResults(rows: SimpleExtractedProfile[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function loadSimpleImportResults(): SimpleExtractedProfile[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as SimpleExtractedProfile[];
  } catch {
    return [];
  }
}

export function clearSimpleImportResults(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
}
