import type { ExtractedInstagramProfile } from "@/lib/types/instagramExtraction";

const STORAGE_KEY = "revit24_instagram_extraction_results";
const LEGACY_STORAGE_KEY = "revit24_simple_import_results";

export function saveExtractionResults(rows: ExtractedInstagramProfile[]): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
}

export function loadExtractionResults(): ExtractedInstagramProfile[] {
  if (typeof window === "undefined") return [];
  const raw = sessionStorage.getItem(STORAGE_KEY) ?? sessionStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as ExtractedInstagramProfile[];
  } catch {
    return [];
  }
}

export function clearExtractionResults(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(STORAGE_KEY);
  sessionStorage.removeItem(LEGACY_STORAGE_KEY);
}

/** @deprecated Use saveExtractionResults */
export const saveSimpleImportResults = saveExtractionResults;

/** @deprecated Use loadExtractionResults */
export const loadSimpleImportResults = loadExtractionResults;

/** @deprecated Use clearExtractionResults */
export const clearSimpleImportResults = clearExtractionResults;
