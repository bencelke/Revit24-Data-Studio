import type {
  ApprovedRecordDocument,
  CreateApprovedRecordInput,
  CreateReviewHistoryInput,
  ReviewHistoryEntry,
} from "@/lib/types/review";

const mockApprovedRecords = new Map<string, ApprovedRecordDocument>();
const mockReviewHistory = new Map<string, ReviewHistoryEntry>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockReviewStore = {
  createApprovedRecord(input: CreateApprovedRecordInput): ApprovedRecordDocument {
    const id = generateId("mock_approved");
    const record: ApprovedRecordDocument = { ...input, id };
    mockApprovedRecords.set(id, record);
    return record;
  },

  getApprovedRecord(id: string): ApprovedRecordDocument | null {
    return mockApprovedRecords.get(id) ?? null;
  },

  getApprovedRecordByImportRecordId(
    importRecordId: string,
  ): ApprovedRecordDocument | null {
    return (
      [...mockApprovedRecords.values()].find(
        (record) => record.importRecordId === importRecordId,
      ) ?? null
    );
  },

  listApprovedRecords(): ApprovedRecordDocument[] {
    return [...mockApprovedRecords.values()].sort(
      (a, b) => new Date(b.approvedAt).getTime() - new Date(a.approvedAt).getTime(),
    );
  },

  createReviewHistoryEntry(input: CreateReviewHistoryInput): ReviewHistoryEntry {
    const id = generateId("mock_history");
    const entry: ReviewHistoryEntry = { ...input, id };
    mockReviewHistory.set(id, entry);
    return entry;
  },

  listReviewHistoryByRecordId(recordId: string): ReviewHistoryEntry[] {
    return [...mockReviewHistory.values()]
      .filter((entry) => entry.recordId === recordId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  },

  listRecentReviewHistory(max = 20): ReviewHistoryEntry[] {
    return [...mockReviewHistory.values()]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, max);
  },
};
