import type {
  CreateMergeHistoryInput,
  MergeHistoryDocument,
} from "@/lib/types/duplicates";

const mockHistory = new Map<string, MergeHistoryDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockMergeHistoryStore = {
  create(input: CreateMergeHistoryInput): MergeHistoryDocument {
    const id = generateId("merge_hist");
    const entry: MergeHistoryDocument = { ...input, id };
    mockHistory.set(id, entry);
    return entry;
  },

  listByMatchId(matchId: string): MergeHistoryDocument[] {
    return [...mockHistory.values()]
      .filter((entry) => entry.matchId === matchId)
      .sort((a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime());
  },

  listAll(): MergeHistoryDocument[] {
    return [...mockHistory.values()].sort(
      (a, b) => new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime(),
    );
  },
};
