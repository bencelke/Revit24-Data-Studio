import type { ProfileExtractionProvider, ProfileExtractionResult } from "@/lib/types/profile-extraction";
import type { ExtractionRecordDocument } from "@/lib/types/queue";
import { defaultInstagramProfileExtractor } from "./instagramProfileExtractor";

export interface InstagramWorkerContext {
  jobId: string;
  workerId: string;
  extractionRecordId: string;
  importRecordId: string;
}

export class InstagramProfileWorker {
  constructor(
    private readonly extractor: ProfileExtractionProvider = defaultInstagramProfileExtractor,
  ) {}

  async processRecord(
    record: ExtractionRecordDocument,
  ): Promise<ProfileExtractionResult & { username: string }> {
    const input = {
      profileUrl: record.profileUrl,
      username: record.username,
    };

    const result = await this.extractor.extractProfile(input);
    const username =
      result.data?.username ??
      record.username ??
      input.profileUrl?.split("/").filter(Boolean).pop() ??
      "unknown";

    return { ...result, username };
  }
}

export const defaultInstagramProfileWorker = new InstagramProfileWorker();
