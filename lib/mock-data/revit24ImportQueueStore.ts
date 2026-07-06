import type {
  CreateRevit24ImportQueueInput,
  Revit24ImportQueueDocument,
} from "@/lib/types/simpleInstagramImport";

const mockQueue = new Map<string, Revit24ImportQueueDocument>();
let mockIdCounter = 0;

function generateId(): string {
  mockIdCounter += 1;
  return `r24_queue_mock_${mockIdCounter}`;
}

export const mockRevit24ImportQueueStore = {
  createRecords(inputs: CreateRevit24ImportQueueInput[]): Revit24ImportQueueDocument[] {
    return inputs.map((input) => {
      const id = generateId();
      const record: Revit24ImportQueueDocument = { ...input, id };
      mockQueue.set(id, record);
      return record;
    });
  },

  listRecords(): Revit24ImportQueueDocument[] {
    return [...mockQueue.values()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  listUsernames(): string[] {
    return [...mockQueue.values()].map((record) => record.username.toLowerCase());
  },

  findByUsername(username: string): Revit24ImportQueueDocument | null {
    const normalized = username.toLowerCase();
    for (const record of mockQueue.values()) {
      if (record.username.toLowerCase() === normalized) {
        return record;
      }
    }
    return null;
  },

  deleteRecord(id: string): boolean {
    return mockQueue.delete(id);
  },

  count(): number {
    return mockQueue.size;
  },
};
