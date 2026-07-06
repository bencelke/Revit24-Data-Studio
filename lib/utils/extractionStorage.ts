import {
  LOCAL_STORAGE_KEY,
  saveExtractionResults,
  listExtractionResults,
  listExtractionResultsSync,
  deleteExtractionResult,
  clearExtractionResults,
  usesLocalStorage,
} from "@/lib/repositories/instagramExtractionStorage";

export {
  LOCAL_STORAGE_KEY,
  saveExtractionResults,
  listExtractionResults,
  listExtractionResultsSync,
  deleteExtractionResult,
  clearExtractionResults,
  usesLocalStorage,
};

/** @deprecated Use listExtractionResultsSync */
export const loadExtractionResults = listExtractionResultsSync;

/** @deprecated Use saveExtractionResults */
export const saveSimpleImportResults = saveExtractionResults;

/** @deprecated Use listExtractionResultsSync */
export const loadSimpleImportResults = listExtractionResultsSync;

/** @deprecated Use clearExtractionResults */
export const clearSimpleImportResults = clearExtractionResults;
