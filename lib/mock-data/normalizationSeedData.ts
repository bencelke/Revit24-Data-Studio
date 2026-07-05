import { mockNormalizationStore } from "@/lib/mock-data/normalizationStore";
import { normalizeExtractedMetadata } from "@/lib/services/normalizationPipeline";
import { findPotentialMatches, toEntityMatchDocument } from "@/lib/services/entityMatchingService";
import type { RawExtractedMetadata } from "@/lib/types/normalization";

const SEED_PROFILES: RawExtractedMetadata[] = [
  {
    source: "instagram",
    sourceRecordId: "seed_ig_bmwclub",
    displayName: "BMW Club Stuttgart",
    username: "bmwclubstuttgart",
    bio: "Official BMW enthusiasts club in Stuttgart, Germany. Cars & Coffee every month. Contact: hello@bmwclub-stuttgart.de",
    website: "https://bmwclub-stuttgart.de",
    publicEmail: "hello@bmwclub-stuttgart.de",
    publicPhone: null,
    profileUrl: "https://instagram.com/bmwclubstuttgart",
    businessCategory: "Automotive Community",
    country: "Germany",
    city: "Stuttgart",
    verified: false,
  },
  {
    source: "instagram",
    sourceRecordId: "seed_ig_porsche",
    displayName: "Porsche Club Munich",
    username: "porscheclubmunich",
    bio: "Porsche owners community · Track days · Tuning meets · Based in Munich, Germany",
    website: "https://porscheclub-munich.com",
    publicEmail: null,
    publicPhone: "+49891234567",
    profileUrl: "https://instagram.com/porscheclubmunich",
    businessCategory: "Club",
    country: "Germany",
    city: "Munich",
    verified: true,
  },
  {
    source: "instagram",
    sourceRecordId: "seed_ig_detailer",
    displayName: "Precision Auto Detailing",
    username: "precisionautodetailing",
    bio: "Premium detailing & ceramic coating. BMW · Mercedes · Porsche specialists. Berlin, Germany",
    website: "https://precision-auto-detailing.de",
    publicEmail: "info@precision-auto-detailing.de",
    publicPhone: null,
    profileUrl: "https://instagram.com/precisionautodetailing",
    businessCategory: "Detailer",
    country: "Germany",
    city: "Berlin",
    verified: false,
  },
  {
    source: "instagram",
    sourceRecordId: "seed_ig_drift",
    displayName: "Euro Drift Collective",
    username: "eurodriftcollective",
    bio: "European drift community. JDM & Euro builds. Event organizer for track days.",
    website: null,
    publicEmail: null,
    publicPhone: null,
    profileUrl: "https://instagram.com/eurodriftcollective",
    businessCategory: null,
    country: null,
    city: null,
    verified: false,
  },
];

export function seedNormalizationMockDataIfEmpty(): void {
  if (mockNormalizationStore.hasRecords()) return;

  const timestamp = new Date().toISOString();
  const records = SEED_PROFILES.map((raw) =>
    mockNormalizationStore.upsertRecord(normalizeExtractedMetadata(raw)),
  );

  for (const record of records) {
    mockNormalizationStore.createLog({
      normalizedRecordId: record.id,
      timestamp,
      event: "Record Normalized",
      message: `Normalized ${record.displayName} as ${record.entityType}`,
      details: { confidenceScore: record.confidenceScore },
    });

    const matches = findPotentialMatches(record, records);
    for (const match of matches.slice(0, 3)) {
      mockNormalizationStore.createMatch(
        toEntityMatchDocument(record.id, match, timestamp),
      );
    }
  }
}
