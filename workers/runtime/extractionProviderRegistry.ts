import type { ExtractionPlatform } from "@/lib/types/queue";
import type { ExtractionProvider } from "@/lib/types/extraction-provider";
import { defaultInstagramExtractionProvider } from "@/workers/runtime/providers/instagramExtractionProvider";

const providers = new Map<ExtractionPlatform, ExtractionProvider>([
  ["instagram", defaultInstagramExtractionProvider],
]);

export function registerExtractionProvider(provider: ExtractionProvider): void {
  providers.set(provider.platform, provider);
}

export function getExtractionProvider(platform: ExtractionPlatform): ExtractionProvider | null {
  return providers.get(platform) ?? null;
}

export function listRegisteredProviders(): ExtractionProvider[] {
  return [...providers.values()];
}

export function hasExtractionProvider(platform: ExtractionPlatform): boolean {
  return providers.has(platform);
}
