import { parseInstagramBulkInput } from "@/lib/validation/instagramProfileInput";
import type { InstagramParseSummary, ParsedInstagramRow } from "@/lib/types/instagramExtraction";

export { normalizeInstagramInput, validateInstagramUsername } from "@/lib/validation/instagramProfileInput";

export function parseInstagramInput(text: string): {
  rows: ParsedInstagramRow[];
  summary: InstagramParseSummary;
} {
  const result = parseInstagramBulkInput(text);

  const rows: ParsedInstagramRow[] = result.rows.map((row) => ({
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
