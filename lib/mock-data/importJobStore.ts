import type {
  ImportJobDocument,
  ImportRecordDocument,
  CreateImportJobInput,
  CreateImportRecordInput,
} from "@/lib/types/import-jobs";

const mockJobs = new Map<string, ImportJobDocument>();
const mockRecords = new Map<string, ImportRecordDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockImportJobStore = {
  createImportJob(input: CreateImportJobInput): ImportJobDocument {
    const id = generateId("mock_job");
    const job: ImportJobDocument = { ...input, id };
    mockJobs.set(id, job);
    return job;
  },

  updateImportJob(id: string, data: Partial<ImportJobDocument>): ImportJobDocument | null {
    const existing = mockJobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockJobs.set(id, updated);
    return updated;
  },

  deleteImportJob(id: string): boolean {
    const deleted = mockJobs.delete(id);
    for (const [recordId, record] of mockRecords) {
      if (record.jobId === id) mockRecords.delete(recordId);
    }
    return deleted;
  },

  getImportJob(id: string): ImportJobDocument | null {
    return mockJobs.get(id) ?? null;
  },

  listImportJobs(): ImportJobDocument[] {
    return [...mockJobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  createImportRecords(records: CreateImportRecordInput[]): ImportRecordDocument[] {
    return records.map((record) => {
      const id = generateId("mock_rec");
      const persisted: ImportRecordDocument = { ...record, id };
      mockRecords.set(id, persisted);
      return persisted;
    });
  },

  listImportRecords(jobId: string): ImportRecordDocument[] {
    return [...mockRecords.values()]
      .filter((record) => record.jobId === jobId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  updateImportRecord(
    id: string,
    data: Partial<ImportRecordDocument>,
  ): ImportRecordDocument | null {
    const existing = mockRecords.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockRecords.set(id, updated);
    return updated;
  },

  deleteImportRecord(id: string): boolean {
    return mockRecords.delete(id);
  },

  countImportRecords(jobId: string): number {
    return [...mockRecords.values()].filter((record) => record.jobId === jobId).length;
  },

  findExistingRecordsByUsernames(
    usernames: string[],
  ): Map<string, { id: string; username: string }> {
    const existing = new Map<string, { id: string; username: string }>();

    for (const record of mockRecords.values()) {
      if (!record.username) continue;
      const key = record.username.toLowerCase();
      if (usernames.some((u) => u.toLowerCase() === key)) {
        existing.set(key, { id: record.id, username: record.username });
      }
    }

    return existing;
  },

  listAllRecords(): ImportRecordDocument[] {
    return [...mockRecords.values()];
  },
};
