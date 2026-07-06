import type {
  ProfileExtractionInput,
  ProfileExtractionProvider,
  ProfileExtractionResult,
} from "@/lib/types/profile-extraction";
import { isInstagramExtractionEnabled } from "@/lib/config/instagramProvider";
import {
  defaultInstagramPublicProfileExtractor,
  InstagramPublicProfileExtractor,
} from "./instagramPublicProfileExtractor";
import { mapPublicProfileErrorToExtractionError } from "./instagramPublicProfileTypes";
import { INSTAGRAM_WORKER_VERSION } from "./constants";

export class InstagramPublicProfileProvider implements ProfileExtractionProvider {
  readonly platform = "instagram";
  readonly version = INSTAGRAM_WORKER_VERSION;

  constructor(
    private readonly extractor: InstagramPublicProfileExtractor = defaultInstagramPublicProfileExtractor,
  ) {}

  async extractProfile(input: ProfileExtractionInput): Promise<ProfileExtractionResult> {
    const result = await this.extractor.extract(input);

    if (!result.success || !result.data) {
      return {
        success: false,
        data: null,
        error: result.error
          ? mapPublicProfileErrorToExtractionError(result.error)
          : mapPublicProfileErrorToExtractionError({
              code: "unknown_error",
              message: "Extraction failed.",
              retryable: false,
            }),
        durationMs: result.durationMs,
        workerVersion: result.workerVersion,
      };
    }

    return {
      success: true,
      data: this.extractor.toProfileMetadata(result.data),
      error: null,
      durationMs: result.durationMs,
      workerVersion: result.workerVersion,
    };
  }
}

export const defaultInstagramPublicProfileProvider = new InstagramPublicProfileProvider();

export function isInstagramProviderLive(): boolean {
  return isInstagramExtractionEnabled();
}
