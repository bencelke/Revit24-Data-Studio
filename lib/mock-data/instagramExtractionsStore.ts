import type {
  CreateInstagramExtractionInput,
  InstagramExtractionDocument,
} from "@/lib/types/instagramExtraction";

const mockExtractions = new Map<string, InstagramExtractionDocument>();

function generateId(): string {
  return `ig_ext_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export const mockInstagramExtractionsStore = {
  create(input: CreateInstagramExtractionInput): InstagramExtractionDocument {
    const id = generateId();
    const record: InstagramExtractionDocument = { ...input, id };
    mockExtractions.set(id, record);
    return record;
  },

  createBatch(inputs: CreateInstagramExtractionInput[]): InstagramExtractionDocument[] {
    return inputs.map((input) => this.create(input));
  },

  list(): InstagramExtractionDocument[] {
    return [...mockExtractions.values()].sort(
      (a, b) => new Date(b.extractedAt).getTime() - new Date(a.extractedAt).getTime(),
    );
  },

  findByUsername(username: string): InstagramExtractionDocument | null {
    const key = username.toLowerCase();
    return [...mockExtractions.values()].find((record) => record.username.toLowerCase() === key) ?? null;
  },

  upsert(input: CreateInstagramExtractionInput): { record: InstagramExtractionDocument; updated: boolean } {
    const existing = this.findByUsername(input.username);
    if (existing) {
      const record: InstagramExtractionDocument = {
        ...existing,
        ...input,
        id: existing.id,
        createdAt: existing.createdAt,
        updatedAt: input.updatedAt,
      };
      mockExtractions.set(existing.id, record);
      return { record, updated: true };
    }

    return { record: this.create(input), updated: false };
  },

  delete(id: string): boolean {
    return mockExtractions.delete(id);
  },

  clear(): number {
    const count = mockExtractions.size;
    mockExtractions.clear();
    return count;
  },
};
