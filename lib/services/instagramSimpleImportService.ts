import { mockRevit24ImportQueueStore } from "@/lib/mock-data/revit24ImportQueueStore";
import { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  isInstagramExtractionEnabled,
  shouldUseInstagramMockExtraction,
} from "@/lib/config/instagramProvider";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import {
  createRevit24ImportQueueRecords,
} from "@/lib/repositories/revit24ImportQueueRepository";
import type {
  CreateRevit24ImportQueueInput,
  InstagramSimpleExtractedRow,
  InstagramSimpleImportPageData,
  Revit24ImportQueueDocument,
} from "@/lib/types/instagramSimpleImport";
import { defaultInstagramPublicProfileProvider } from "@/workers/instagram/instagramPublicProfileProvider";

function titleCaseUsername(username: string): string {
  return username
    .split(/[._-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildMockRow(username: string, profileUrl: string): InstagramSimpleExtractedRow {
  const timestamp = new Date().toISOString();
  return {
    id: `simple_${username}_${Date.now()}`,
    username,
    profileUrl,
    displayName: titleCaseUsername(username),
    profileImageUrl: null,
    bio: null,
    website: null,
    publicEmail: null,
    extractionStatus: "mock",
    error: null,
    extractedAt: timestamp,
  };
}

async function extractSingleProfile(input: {
  username: string;
  profileUrl: string;
}): Promise<InstagramSimpleExtractedRow> {
  const timestamp = new Date().toISOString();

  if (shouldUseInstagramMockExtraction()) {
    return buildMockRow(input.username, input.profileUrl);
  }

  try {
    const result = await defaultInstagramPublicProfileProvider.extractProfile({
      username: input.username,
      profileUrl: input.profileUrl,
    });

    if (!result.success || !result.data) {
      return {
        id: `simple_${input.username}_${Date.now()}`,
        username: input.username,
        profileUrl: input.profileUrl,
        displayName: null,
        profileImageUrl: null,
        bio: null,
        website: null,
        publicEmail: null,
        extractionStatus: "failed",
        error: result.error?.message ?? "Extraction failed.",
        extractedAt: timestamp,
      };
    }

    return {
      id: `simple_${input.username}_${Date.now()}`,
      username: result.data.username,
      profileUrl: result.data.profileUrl,
      displayName: result.data.displayName,
      profileImageUrl: result.data.profileImageUrl,
      bio: result.data.bio,
      website: result.data.website,
      publicEmail: result.data.publicEmail,
      extractionStatus: "completed",
      error: null,
      extractedAt: timestamp,
    };
  } catch (error) {
    return {
      id: `simple_${input.username}_${Date.now()}`,
      username: input.username,
      profileUrl: input.profileUrl,
      displayName: null,
      profileImageUrl: null,
      bio: null,
      website: null,
      publicEmail: null,
      extractionStatus: "failed",
      error: error instanceof Error ? error.message : "Extraction failed.",
      extractedAt: timestamp,
    };
  }
}

export async function extractInstagramSimpleProfiles(
  profiles: { username: string; profileUrl: string }[],
): Promise<InstagramSimpleExtractedRow[]> {
  const results: InstagramSimpleExtractedRow[] = [];

  for (const profile of profiles) {
    results.push(await extractSingleProfile(profile));
  }

  return results;
}

function escapeCsvValue(value: string | null | undefined): string {
  const safe = value ?? "";
  if (safe.includes(",") || safe.includes('"') || safe.includes("\n")) {
    return `"${safe.replace(/"/g, '""')}"`;
  }
  return safe;
}

export function buildInstagramSimpleImportCsv(rows: InstagramSimpleExtractedRow[]): string {
  const header =
    "username,profileUrl,displayName,profileImageUrl,bio,website,publicEmail,extractionStatus,error,extractedAt";

  const lines = rows.map((row) =>
    [
      escapeCsvValue(row.username),
      escapeCsvValue(row.profileUrl),
      escapeCsvValue(row.displayName),
      escapeCsvValue(row.profileImageUrl),
      escapeCsvValue(row.bio),
      escapeCsvValue(row.website),
      escapeCsvValue(row.publicEmail),
      escapeCsvValue(row.extractionStatus),
      escapeCsvValue(row.error),
      escapeCsvValue(row.extractedAt),
    ].join(","),
  );

  return [header, ...lines].join("\n");
}

function toQueueInput(row: InstagramSimpleExtractedRow): CreateRevit24ImportQueueInput {
  const timestamp = new Date().toISOString();
  return {
    source: "instagram",
    username: row.username,
    profileUrl: row.profileUrl,
    displayName: row.displayName,
    profileImageUrl: row.profileImageUrl,
    bio: row.bio,
    website: row.website,
    publicEmail: row.publicEmail,
    status: "pending_review",
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export async function sendToRevit24ImportQueue(
  rows: InstagramSimpleExtractedRow[],
): Promise<{ records: Revit24ImportQueueDocument[]; dataMode: "firestore" | "mock" }> {
  const successful = rows.filter(
    (row) => row.extractionStatus === "completed" || row.extractionStatus === "mock",
  );

  if (successful.length === 0) {
    throw new Error("No successfully extracted profiles to queue.");
  }

  const inputs = successful.map(toQueueInput);

  if (isFirestoreAvailable()) {
    try {
      const records = await createRevit24ImportQueueRecords(inputs);
      return { records, dataMode: "firestore" };
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return {
          records: mockRevit24ImportQueueStore.createRecords(inputs),
          dataMode: "mock",
        };
      }
      throw error;
    }
  }

  return {
    records: mockRevit24ImportQueueStore.createRecords(inputs),
    dataMode: "mock",
  };
}

export async function getInstagramSimpleImportPageData(): Promise<InstagramSimpleImportPageData> {
  return {
    firebaseConfigured: isFirebaseConfigured(),
    dataMode: isFirestoreAvailable() ? "firestore" : "mock",
    extractionLive: isInstagramExtractionEnabled(),
  };
}
