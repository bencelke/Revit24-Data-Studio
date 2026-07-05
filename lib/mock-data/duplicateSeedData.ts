import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { seedNormalizationMockDataIfEmpty } from "@/lib/mock-data/normalizationSeedData";
import { findPotentialMatches, toEntityMatchDocument } from "@/lib/services/entityMatchingService";

export function seedDuplicateMockDataIfEmpty(): void {
  seedNormalizationMockDataIfEmpty();
  if (mockNormalizationStore.hasMatches()) return;

  const timestamp = new Date().toISOString();
  const records = mockNormalizationStore.listRecords();
  if (records.length < 2) return;

  for (const record of records) {
    const candidates = findPotentialMatches(record, records);
    for (const match of candidates.slice(0, 2)) {
      mockNormalizationStore.createMatch(
        toEntityMatchDocument(record.id, match, timestamp),
      );
    }
  }

  const allMatches = mockNormalizationStore.listAllMatches();
  if (allMatches.length >= 2) {
    mockNormalizationStore.updateMatch(allMatches[1].id, {
      status: "resolved",
      resolution: "keep_separate",
      resolvedBy: "reviewer-dev",
      resolvedAt: timestamp,
      updatedAt: timestamp,
      notes: "Reviewed — distinct entities",
    });
  }
  if (allMatches.length >= 3) {
    mockNormalizationStore.updateMatch(allMatches[2].id, {
      status: "ignored",
      resolvedBy: "reviewer-dev",
      resolvedAt: timestamp,
      updatedAt: timestamp,
      notes: "False positive — different businesses",
    });
  }
}
