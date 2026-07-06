import type {
  CreateInstagramExtractionQueueInput,
  InstagramExtractionQueueDocument,
} from "@/lib/types/instagramExtractionQueue";

const mockQueue = new Map<string, InstagramExtractionQueueDocument>();

function generateId(): string {
  return `ig_queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockInstagramExtractionQueueStore = {
  create(input: CreateInstagramExtractionQueueInput): InstagramExtractionQueueDocument {
    const id = generateId();
    const record: InstagramExtractionQueueDocument = { ...input, id };
    mockQueue.set(id, record);
    return record;
  },

  createBatch(inputs: CreateInstagramExtractionQueueInput[]): InstagramExtractionQueueDocument[] {
    return inputs.map((input) => this.create(input));
  },

  list(): InstagramExtractionQueueDocument[] {
    return [...mockQueue.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  findByUsername(username: string): InstagramExtractionQueueDocument | null {
    const key = username.toLowerCase();
    return (
      [...mockQueue.values()].find((record) => record.username.toLowerCase() === key) ?? null
    );
  },

  findPending(): InstagramExtractionQueueDocument[] {
    return [...mockQueue.values()]
      .filter((record) => record.status === "pending")
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  },

  update(
    id: string,
    patch: Partial<CreateInstagramExtractionQueueInput>,
  ): InstagramExtractionQueueDocument | null {
    const existing = mockQueue.get(id);
    if (!existing) {
      return null;
    }

    const record: InstagramExtractionQueueDocument = {
      ...existing,
      ...patch,
      id: existing.id,
      createdAt: existing.createdAt,
    };
    mockQueue.set(id, record);
    return record;
  },
};
