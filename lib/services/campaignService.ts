import { mockDiscoveryStore } from "@/lib/mock-data/discoveryEngineStore";
import { seedDiscoveryEngineMockDataIfEmpty } from "@/lib/mock-data/discoveryEngineSeedData";
import {
  FirestoreNotConfiguredError,
  getErrorMessage,
} from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createDiscoveryCampaign as persistCampaign,
  getDiscoveryCampaign as fetchCampaign,
  listDiscoveryCampaigns as fetchCampaigns,
  updateDiscoveryCampaign as persistUpdateCampaign,
} from "@/lib/repositories/discoveryCampaignRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  CreateCampaignPayload,
  DiscoveryCampaignDocument,
  DiscoveryCampaignListResult,
} from "@/lib/types/discovery-engine";
import {
  buildHashtagsFromInput,
  buildKeywordFromParts,
} from "@/lib/services/keywordGenerationService";

const CREATED_BY = "system-dev";

async function resolveDataMode(): Promise<"firestore" | "mock"> {
  if (isFirestoreAvailable()) return "firestore";
  seedDiscoveryEngineMockDataIfEmpty();
  return "mock";
}

export async function listCampaigns(): Promise<DiscoveryCampaignDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchCampaigns();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        seedDiscoveryEngineMockDataIfEmpty();
        return mockDiscoveryStore.listCampaigns();
      }
      throw error;
    }
  }
  return mockDiscoveryStore.listCampaigns();
}

export async function getCampaignById(id: string): Promise<DiscoveryCampaignDocument | null> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchCampaign(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockDiscoveryStore.getCampaign(id);
      }
      throw error;
    }
  }
  return mockDiscoveryStore.getCampaign(id);
}

export async function createCampaign(
  payload: CreateCampaignPayload,
): Promise<DiscoveryCampaignDocument> {
  const now = new Date().toISOString();
  const builderKeywords = buildKeywordFromParts({
    country: payload.country,
    city: payload.city,
    area: payload.area,
    brand: payload.brands?.[0],
    vehicleType: payload.vehicleTypes?.[0],
  });

  const builderHashtags = buildHashtagsFromInput({
    brand: payload.brands?.[0],
    hashtag: payload.hashtags?.[0],
  });

  const input = {
    name: payload.name,
    description: payload.description ?? null,
    country: payload.country ?? null,
    state: payload.state ?? null,
    city: payload.city ?? null,
    area: payload.area ?? null,
    radius: payload.radius ?? null,
    provider: payload.provider,
    entityTypes: payload.entityTypes,
    keywords: [...(payload.keywords ?? []), ...builderKeywords],
    hashtags: [...(payload.hashtags ?? []), ...builderHashtags],
    brands: payload.brands ?? [],
    vehicleTypes: payload.vehicleTypes ?? [],
    languages: payload.languages ?? ["en"],
    status: payload.status ?? "draft",
    createdBy: CREATED_BY,
    createdAt: now,
    updatedAt: now,
    templateId: payload.templateId ?? null,
    metadata: { createdVia: "campaign_builder" },
  };

  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await persistCampaign(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockDiscoveryStore.createCampaign(input);
      }
      throw error;
    }
  }
  return mockDiscoveryStore.createCampaign(input);
}

export async function updateCampaignStatus(
  id: string,
  status: DiscoveryCampaignDocument["status"],
): Promise<DiscoveryCampaignDocument | null> {
  const mode = await resolveDataMode();
  const update = { status, updatedAt: new Date().toISOString() };

  if (mode === "firestore") {
    try {
      await persistUpdateCampaign(id, update);
      return await fetchCampaign(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockDiscoveryStore.updateCampaign(id, update);
      }
      throw error;
    }
  }
  return mockDiscoveryStore.updateCampaign(id, update);
}

export async function getCampaignListResult(
  page = 1,
  pageSize = 20,
): Promise<DiscoveryCampaignListResult> {
  const campaigns = await listCampaigns();
  const total = campaigns.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    campaigns: campaigns.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export function getCampaignServiceWarning(): string | undefined {
  if (!isFirebaseConfigured()) {
    return "Firebase is not configured. Discovery data is served from mock storage.";
  }
  return undefined;
}

export function safeCampaignErrorMessage(error: unknown): string {
  return getErrorMessage(error);
}
