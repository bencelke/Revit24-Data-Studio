import type {
  CreateRevit24ImportQueueInput,
  Revit24ImportQueueDocument,
} from "@/lib/types/instagramSimpleImport";

const mockQueue = new Map<string, Revit24ImportQueueDocument>();

function generateId(): string {
  return `r24_queue_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
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

  count(): number {
    return mockQueue.size;
  },
};
