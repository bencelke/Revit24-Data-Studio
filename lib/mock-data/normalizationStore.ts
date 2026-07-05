import type { CreateNormalizedRecordInput, NormalizedRecordDocument } from "@/lib/types/normalization";
import type {
  CreateEntityMatchInput,
  EntityMatchDocument,
  EntityMatchStatus,
} from "@/lib/types/duplicates";

const mockRecords = new Map<string, NormalizedRecordDocument>();
const mockLogs = new Map<string, import("@/lib/types/normalization").NormalizationLogDocument>();
const mockMatches = new Map<string, EntityMatchDocument>();

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

  updateRecord(id: string, data: Partial<CreateNormalizedRecordInput>): NormalizedRecordDocument | null {
    const existing = mockRecords.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockRecords.set(id, updated);
    return updated;
  },

  createMatch(input: CreateEntityMatchInput) {
    const id = generateId("entity_match");
    const match: EntityMatchDocument = { ...input, id };
    mockMatches.set(id, match);
    return match;
  },

  getMatch(id: string): EntityMatchDocument | null {
    return mockMatches.get(id) ?? null;
  },

  updateMatch(id: string, data: Partial<CreateEntityMatchInput>): EntityMatchDocument | null {
    const existing = mockMatches.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockMatches.set(id, updated);
    return updated;
  },

  listMatchesForRecord(recordId: string) {
    return [...mockMatches.values()]
      .filter((match) => match.recordAId === recordId || match.recordBId === recordId)
      .sort((a, b) => b.confidenceScore - a.confidenceScore);
  },

  listAllMatches() {
    return [...mockMatches.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
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

  hasMatches(): boolean {
    return mockMatches.size > 0;
  },

  seedMatchStatuses(statuses: Array<{ id: string; status: EntityMatchStatus }>) {
    for (const item of statuses) {
      const existing = mockMatches.get(item.id);
      if (existing) mockMatches.set(item.id, { ...existing, status: item.status });
    }
  },
};
