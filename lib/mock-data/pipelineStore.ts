import type {
  CreatePipelineEventInput,
  CreatePipelineJobInput,
  CreatePublishQueueInput,
  PipelineEventDocument,
  PipelineJobDocument,
  PublishQueueDocument,
} from "@/lib/types/pipeline";

const mockJobs = new Map<string, PipelineJobDocument>();
const mockEvents = new Map<string, PipelineEventDocument>();
const mockPublish = new Map<string, PublishQueueDocument>();

function generateId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockPipelineStore = {
  createJob(input: CreatePipelineJobInput): PipelineJobDocument {
    const id = generateId("pipe_job");
    const job: PipelineJobDocument = { ...input, id };
    mockJobs.set(id, job);
    return job;
  },

  getJob(id: string): PipelineJobDocument | null {
    return mockJobs.get(id) ?? null;
  },

  listJobs(): PipelineJobDocument[] {
    return [...mockJobs.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  updateJob(id: string, data: Partial<CreatePipelineJobInput>): PipelineJobDocument | null {
    const existing = mockJobs.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockJobs.set(id, updated);
    return updated;
  },

  createEvent(input: CreatePipelineEventInput): PipelineEventDocument {
    const id = generateId("pipe_evt");
    const event: PipelineEventDocument = { ...input, id };
    mockEvents.set(id, event);
    return event;
  },

  listEventsByJobId(jobId: string): PipelineEventDocument[] {
    return [...mockEvents.values()]
      .filter((event) => event.jobId === jobId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  },

  listEvents(): PipelineEventDocument[] {
    return [...mockEvents.values()].sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  },

  createPublishEntry(input: CreatePublishQueueInput): PublishQueueDocument {
    const id = generateId("pub_q");
    const entry: PublishQueueDocument = { ...input, id };
    mockPublish.set(id, entry);
    return entry;
  },

  listPublish(): PublishQueueDocument[] {
    return [...mockPublish.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  updatePublish(id: string, data: Partial<CreatePublishQueueInput>): PublishQueueDocument | null {
    const existing = mockPublish.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...data, id };
    mockPublish.set(id, updated);
    return updated;
  },

  hasJobs(): boolean {
    return mockJobs.size > 0;
  },
};
