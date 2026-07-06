export type {
  SimpleExtractionStatus as InstagramSimpleExtractionStatus,
  SimpleParsedRow as InstagramSimpleParsedRow,
  SimpleExtractedProfile as InstagramSimpleExtractedRow,
  SimpleImportPageData as InstagramSimpleImportPageData,
  Revit24ImportQueueDocument,
  CreateRevit24ImportQueueInput,
  UploadToRevit24Result,
} from "@/lib/types/simpleInstagramImport";

export {
  SIMPLE_EXTRACTION_STATUSES as INSTAGRAM_SIMPLE_EXTRACTION_STATUSES,
  REVIT24_IMPORT_QUEUE_STATUSES,
} from "@/lib/types/simpleInstagramImport";

export interface InstagramSimpleImportSummary {
  totalLinks: number;
  valid: number;
  duplicates: number;
  invalid: number;
  extracted: number;
  failed: number;
}
