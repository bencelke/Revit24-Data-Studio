export {
  parseSimpleInstagramInput as parseInstagramSimpleInput,
  normalizeInstagramInput,
  validateInstagramUsername,
} from "@/lib/validation/simpleInstagramInput";

import { parseSimpleInstagramInput } from "@/lib/validation/simpleInstagramInput";
import type { SimpleParseSummary } from "@/lib/types/simpleInstagramImport";

export function buildImportSummary(
  parseSummary: SimpleParseSummary,
  results: { status: string }[] | null,
) {
  const extracted =
    results?.filter((row) => row.status === "completed" || row.status === "mock").length ?? 0;
  const failed = results?.filter((row) => row.status === "failed").length ?? 0;

  return {
    totalLinks: parseSummary.total,
    valid: parseSummary.valid,
    duplicates: parseSummary.duplicate,
    invalid: parseSummary.invalid,
    extracted,
    failed,
  };
}

export { parseSimpleInstagramInput };
