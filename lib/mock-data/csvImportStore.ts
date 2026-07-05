import type {
  CreateCsvImportJobInput,
  CreateCsvImportRecordInput,
  CsvImportJobDocument,
  CsvImportRecordDocument,
} from "@/lib/types/csv-import";

const mockJobs = new Map<string, CsvImportJobDocument>();
const mockRecords = new Map<string, CsvImportRecordDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockCsvImportStore = {
  createJob(input: CreateCsvImportJobInput): CsvImportJobDocument {
    const id = generateId("csv_job");
    const job: CsvImportJobDocument = { ...input, id };
    mockJobs.set(id, job);
    return job;
  },

  getJob(id: string): CsvImportJobDocument | null {
    return mockJobs.get(id) ?? null;
  },

  listJobs(): CsvImportJobDocument[] {
    return [...mockJobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  updateJob(id: string, data: Partial<CreateCsvImportJobInput>): CsvImportJobDocument | null {
    const existing = mockJobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockJobs.set(id, updated);
    return updated;
  },

  createRecords(inputs: CreateCsvImportRecordInput[]): CsvImportRecordDocument[] {
    return inputs.map((input) => {
      const id = generateId("csv_rec");
      const record: CsvImportRecordDocument = { ...input, id };
      mockRecords.set(id, record);
      return record;
    });
  },

  listRecordsByJobId(jobId: string): CsvImportRecordDocument[] {
    return [...mockRecords.values()]
      .filter((record) => record.jobId === jobId)
      .sort((a, b) => a.rowNumber - b.rowNumber);
  },

  updateRecord(id: string, data: Partial<CreateCsvImportRecordInput>): CsvImportRecordDocument | null {
    const existing = mockRecords.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockRecords.set(id, updated);
    return updated;
  },
};
