import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import type { SimpleParsedRow, SimpleParseSummary } from "@/lib/types/simpleInstagramImport";

export { normalizeInstagramInput, validateInstagramUsername } from "@/lib/validation/instagramProfileInput";

export function parseSimpleInstagramInput(text: string): {
  rows: SimpleParsedRow[];
  summary: SimpleParseSummary;
} {
  const result = parseInstagramBulkInput(text);

  const rows: SimpleParsedRow[] = result.rows.map((row) => ({
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
      total: result.summary.totalLines,
      valid: result.summary.validProfiles,
      duplicate: result.summary.duplicates,
      invalid: result.summary.invalidRows,
    },
  };
}
