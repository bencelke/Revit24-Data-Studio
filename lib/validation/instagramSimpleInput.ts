import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import type {
  InstagramSimpleImportSummary,
  InstagramSimpleParsedRow,
} from "@/lib/types/instagramSimpleImport";

export { normalizeInstagramInput, validateInstagramUsername } from "@/lib/validation/instagramProfileInput";

export function parseInstagramSimpleInput(text: string): {
  rows: InstagramSimpleParsedRow[];
  summary: Omit<InstagramSimpleImportSummary, "extracted" | "failed">;
} {
  const result = parseInstagramBulkInput(text);

  const rows: InstagramSimpleParsedRow[] = result.rows.map((row) => ({
    lineNumber: row.lineNumber,
    originalInput: row.originalInput,
    username: row.username,
    profileUrl: row.profileUrl,
    validationStatus: row.status,
    validationError: row.error,
  }));

  return {
    rows,
    summary: {
      totalLinks: result.summary.totalLines,
      valid: result.summary.validProfiles,
      duplicates: result.summary.duplicates,
      invalid: result.summary.invalidRows,
    },
  };
}

export function buildImportSummary(
  parseSummary: Omit<InstagramSimpleImportSummary, "extracted" | "failed">,
  results: { extractionStatus: string }[] | null,
): InstagramSimpleImportSummary {
  const extractedCount =
    results?.filter(
      (row) => row.extractionStatus === "completed" || row.extractionStatus === "mock",
    ).length ?? 0;
  const failedCount = results?.filter((row) => row.extractionStatus === "failed").length ?? 0;

  return {
    ...parseSummary,
    extracted: extractedCount,
    failed: failedCount,
  };
}
