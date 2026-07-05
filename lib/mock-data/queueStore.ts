import type {
  CreateExtractionJobInput,
  CreateExtractionRecordInput,
  ExtractionJobDocument,
  ExtractionRecordDocument,
  QueueTimelineEvent,
} from "@/lib/types/queue";

const mockJobs = new Map<string, ExtractionJobDocument>();
const mockRecords = new Map<string, ExtractionRecordDocument>();
const mockTimeline = new Map<string, QueueTimelineEvent[]>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockQueueStore = {
  createExtractionJob(input: CreateExtractionJobInput): ExtractionJobDocument {
    const id = generateId("ext_job");
    const job: ExtractionJobDocument = { ...input, id };
    mockJobs.set(id, job);
    mockTimeline.set(id, []);
    return job;
  },

  updateExtractionJob(
    id: string,
    data: Partial<ExtractionJobDocument>,
  ): ExtractionJobDocument | null {
    const existing = mockJobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockJobs.set(id, updated);
    return updated;
  },

  getExtractionJob(id: string): ExtractionJobDocument | null {
    return mockJobs.get(id) ?? null;
  },

  listExtractionJobs(): ExtractionJobDocument[] {
    return [...mockJobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  createExtractionRecords(
    records: CreateExtractionRecordInput[],
  ): ExtractionRecordDocument[] {
    return records.map((record) => {
      const id = generateId("ext_rec");
      const persisted: ExtractionRecordDocument = { ...record, id };
      mockRecords.set(id, persisted);
      return persisted;
    });
  },

  listExtractionRecords(jobId: string): ExtractionRecordDocument[] {
    return [...mockRecords.values()]
      .filter((record) => record.jobId === jobId)
      .sort((a, b) => (a.username ?? "").localeCompare(b.username ?? ""));
  },

  addTimelineEvent(jobId: string, event: Omit<QueueTimelineEvent, "id">): QueueTimelineEvent {
    const entry: QueueTimelineEvent = { ...event, id: generateId("timeline") };
    const events = mockTimeline.get(jobId) ?? [];
    events.unshift(entry);
    mockTimeline.set(jobId, events);
    return entry;
  },

  getTimeline(jobId: string): QueueTimelineEvent[] {
    return mockTimeline.get(jobId) ?? [];
  },

  hasJobs(): boolean {
    return mockJobs.size > 0;
  },
};
