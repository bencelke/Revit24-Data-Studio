/**
 * Legacy extractor — delegates to InstagramPublicProfileProvider.
 * Kept for backward compatibility with existing imports.
 */
import type {
  ProfileExtractionInput,
  ProfileExtractionProvider,
  ProfileExtractionResult,
} from "@/lib/types/profile-extraction";
import {
  defaultInstagramPublicProfileProvider,
  InstagramPublicProfileProvider,
} from "./instagramPublicProfileProvider";

export class InstagramProfileExtractor implements ProfileExtractionProvider {
  readonly platform = "instagram";
  readonly version: string;

  constructor(
    private readonly provider: InstagramPublicProfileProvider = defaultInstagramPublicProfileProvider,
  ) {
    this.version = provider.version;
  }

  async extractProfile(input: ProfileExtractionInput): Promise<ProfileExtractionResult> {
    return this.provider.extractProfile(input);
  }
}

export const defaultInstagramProfileExtractor = new InstagramProfileExtractor();
