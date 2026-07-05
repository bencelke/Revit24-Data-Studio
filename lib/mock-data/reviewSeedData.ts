import { mockImportJobStore } from "@/lib/mock-data/importJobStore";
import { createDefaultReviewFields } from "@/lib/types/review";

const SEED_JOB_NAME = "Review Demo — Automotive Clubs";

export function seedReviewMockDataIfEmpty(): void {
  if (mockImportJobStore.listAllRecords().length > 0) return;

  const timestamp = new Date().toISOString();
  const job = mockImportJobStore.createImportJob({
    name: SEED_JOB_NAME,
    type: "instagram_profile_links",
    source: "instagram",
    status: "pending_review",
    createdBy: "system-dev",
    createdAt: timestamp,
    updatedAt: timestamp,
    totalRecords: 6,
    validRecords: 4,
    duplicateRecords: 1,
    invalidRecords: 1,
    notes: "Seeded for Admin Review Center demo",
    metadata: { seeded: true },
  });

  const seedRows = [
    {
      originalInput: "https://instagram.com/bmwclubstuttgart",
      username: "bmwclubstuttgart",
      profileUrl: "https://instagram.com/bmwclubstuttgart",
      status: "valid" as const,
      reviewStatus: "pending_review" as const,
      displayName: "BMW Club Stuttgart",
    },
    {
      originalInput: "https://instagram.com/porscheclubmunich",
      username: "porscheclubmunich",
      profileUrl: "https://instagram.com/porscheclubmunich",
      status: "valid" as const,
      reviewStatus: "pending_review" as const,
      displayName: "Porsche Club Munich",
    },
    {
      originalInput: "https://instagram.com/audiownersberlin",
      username: "audiownersberlin",
      profileUrl: "https://instagram.com/audiownersberlin",
      status: "valid" as const,
      reviewStatus: "needs_edit" as const,
      displayName: "Audi Owners Berlin",
      reviewer: "David",
    },
    {
      originalInput: "https://instagram.com/mercedesbenzclub",
      username: "mercedesbenzclub",
      profileUrl: "https://instagram.com/mercedesbenzclub",
      status: "duplicate" as const,
      reviewStatus: "duplicate" as const,
      displayName: "Mercedes-Benz Club",
      duplicateOf: "existing_record",
    },
    {
      originalInput: "https://instagram.com/vwclassicfans",
      username: "vwclassicfans",
      profileUrl: "https://instagram.com/vwclassicfans",
      status: "valid" as const,
      reviewStatus: "approved" as const,
      displayName: "VW Classic Fans",
      reviewer: "John",
    },
    {
      originalInput: "not-a-valid-url",
      username: null,
      profileUrl: null,
      status: "invalid" as const,
      reviewStatus: "rejected" as const,
      error: "Invalid Instagram profile URL",
      reviewer: "Admin",
    },
  ];

  mockImportJobStore.createImportRecords(
    seedRows.map((row) => ({
      jobId: job.id,
      originalInput: row.originalInput,
      username: row.username,
      profileUrl: row.profileUrl,
      status: row.status,
      error: "error" in row ? row.error ?? null : null,
      duplicateOf: "duplicateOf" in row ? row.duplicateOf ?? null : null,
      createdAt: timestamp,
      updatedAt: timestamp,
      ...createDefaultReviewFields(row.status, "instagram"),
      reviewStatus: row.reviewStatus,
      displayName: row.displayName ?? null,
      importSource: "instagram",
      reviewer: "reviewer" in row ? row.reviewer ?? null : null,
      website: null,
      publicEmail: null,
      tags: [],
      country: "Germany",
      city: null,
      description: null,
    })),
  );
}
