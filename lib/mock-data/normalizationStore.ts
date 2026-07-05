import type { CreateNormalizedRecordInput, NormalizedRecordDocument } from "@/lib/types/normalization";

const mockRecords = new Map<string, NormalizedRecordDocument>();
const mockLogs = new Map<string, import("@/lib/types/normalization").NormalizationLogDocument>();
const mockMatches = new Map<string, import("@/lib/types/normalization").EntityMatchDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockNormalizationStore = {
  upsertRecord(input: CreateNormalizedRecordInput): NormalizedRecordDocument {
    const existing = [...mockRecords.values()].find(
      (record) => record.sourceRecordId === input.sourceRecordId,
    );
    if (existing) {
      const updated = { ...input, id: existing.id };
      mockRecords.set(existing.id, updated);
      return updated;
    }
    const id = generateId("norm_rec");
    const record: NormalizedRecordDocument = { ...input, id };
    mockRecords.set(id, record);
    return record;
  },

  getRecord(id: string): NormalizedRecordDocument | null {
    return mockRecords.get(id) ?? null;
  },

  listRecords(): NormalizedRecordDocument[] {
    return [...mockRecords.values()].sort(
      (a, b) => new Date(b.normalizedAt).getTime() - new Date(a.normalizedAt).getTime(),
    );
  },

  createMatch(input: Omit<import("@/lib/types/normalization").EntityMatchDocument, "id">) {
    const id = generateId("entity_match");
    const match = { ...input, id };
    mockMatches.set(id, match);
    return match;
  },

  listMatchesForRecord(recordId: string) {
    return [...mockMatches.values()]
      .filter((match) => match.normalizedRecordId === recordId)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  },

  listAllMatches() {
    return [...mockMatches.values()];
  },

  createLog(input: Omit<import("@/lib/types/normalization").NormalizationLogDocument, "id">) {
    const id = generateId("norm_log");
    const log = { ...input, id };
    mockLogs.set(id, log);
    return log;
  },

  listLogsForRecord(recordId: string) {
    return [...mockLogs.values()]
      .filter((log) => log.normalizedRecordId === recordId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  hasRecords(): boolean {
    return mockRecords.size > 0;
  },
};
