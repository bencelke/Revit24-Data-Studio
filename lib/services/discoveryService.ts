import { mockDiscoveryStore } from "@/lib/mock-data/discoveryEngineStore";
import { seedDiscoveryEngineMockDataIfEmpty } from "@/lib/mock-data/discoveryEngineSeedData";
import {
  FirestoreNotConfiguredError,
  MOCK_MODE_WARNING,
  getErrorMessage,
} from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createDiscoveryJob as persistJob,
  getDiscoveryJob as fetchJob,
  listDiscoveryJobs as fetchJobs,
  listDiscoveryJobsByCampaignId as fetchJobsByCampaignId,
  updateDiscoveryJob as persistUpdateJob,
} from "@/lib/repositories/discoveryJobRepository";
import {
  createDiscoveryResults as persistResults,
  listDiscoveryResults as fetchResults,
  listDiscoveryResultsByCampaignId as fetchResultsByCampaignId,
} from "@/lib/repositories/discoveryResultsRepository";
import {
  listDiscoveryTemplates as fetchTemplates,
} from "@/lib/repositories/discoveryTemplateRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  DiscoveryCampaignDetailData,
  DiscoveryDashboardData,
  DiscoveryDashboardStats,
  DiscoveryJobDocument,
  DiscoveryJobListResult,
  DiscoveryResultDocument,
  DiscoveryResultListResult,
  DiscoveryTemplateDocument,
} from "@/lib/types/discovery-engine";
import { getCampaignById, listCampaigns } from "@/lib/services/campaignService";
import { generateCampaignKeywords } from "@/lib/services/keywordGenerationService";
import {
  dispatchDiscoveryProvider,
  mapDiscoveryProviderToPipelineProvider,
} from "@/lib/services/providerDispatchService";
import { createImportJobFromText } from "@/lib/services/importJobService";
import { startPipelineForImport } from "@/lib/services/pipelineIntegrationService";
import { getReviewDashboardData } from "@/lib/services/reviewService";
import { getQueueDashboardData } from "@/lib/services/queueService";

const CREATED_BY = "system-dev";

async function resolveDataMode(): Promise<"firestore" | "mock"> {
  if (isFirestoreAvailable()) return "firestore";
  seedDiscoveryEngineMockDataIfEmpty();
  return "mock";
}

function buildDashboardStats(
  campaigns: Awaited<ReturnType<typeof listCampaigns>>,
  jobs: DiscoveryJobDocument[],
  results: DiscoveryResultDocument[],
  importQueue: number,
  reviewQueue: number,
): DiscoveryDashboardStats {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return {
    activeCampaigns: campaigns.filter((c) => c.status === "active").length,
    runningJobs: jobs.filter((j) => j.status === "running" || j.status === "queued").length,
    completedToday: jobs.filter((j) => {
      if (!j.completedAt) return false;
      return new Date(j.completedAt) >= today;
    }).length,
    newResults: results.filter((r) => r.status === "new").length,
    importQueue,
    reviewQueue,
  };
}

async function listJobs(): Promise<DiscoveryJobDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockDiscoveryStore.listJobs();
      }
      throw error;
    }
  }
  return mockDiscoveryStore.listJobs();
}

async function listResults(): Promise<DiscoveryResultDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      return await fetchResults();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockDiscoveryStore.listResults();
      }
      throw error;
    }
  }
  return mockDiscoveryStore.listResults();
}

async function saveJobUpdate(
  id: string,
  data: Partial<DiscoveryJobDocument>,
): Promise<DiscoveryJobDocument | null> {
  const mode = await resolveDataMode();
  const payload = { ...data, updatedAt: new Date().toISOString() };

  if (mode === "firestore") {
    try {
      await persistUpdateJob(id, payload);
      return await fetchJob(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        return mockDiscoveryStore.updateJob(id, payload);
      }
      throw error;
    }
  }
  return mockDiscoveryStore.updateJob(id, payload);
}

async function createImportFromResults(
  campaignName: string,
  provider: DiscoveryJobDocument["provider"],
  results: DiscoveryResultDocument[],
): Promise<{ importJobId: string; recordCount: number } | null> {
  const importable = results.filter((r) => !r.isDuplicate && r.status !== "rejected");
  if (importable.length === 0) return null;

  if (provider === "instagram") {
    const urls = importable.map((r) => r.url).join("\n");
    const { job, records } = await createImportJobFromText(
      urls,
      `Discovery — ${campaignName}`,
    );
    return { importJobId: job.id, recordCount: records.length };
  }

  const urls = importable.map((r) => r.url).join("\n");
  const { job, records } = await createImportJobFromText(
    urls,
    `Discovery — ${campaignName} (${provider})`,
  );
  return { importJobId: job.id, recordCount: records.length };
}

export async function getDiscoveryDashboardData(): Promise<DiscoveryDashboardData> {
  try {
    const [campaigns, jobs, results, queueData, reviewData] = await Promise.all([
      listCampaigns(),
      listJobs(),
      listResults(),
      getQueueDashboardData(),
      getReviewDashboardData(),
    ]);

    const mode = await resolveDataMode();
    const stats = buildDashboardStats(
      campaigns,
      jobs,
      results,
      queueData.stats.queued + queueData.stats.waiting,
      reviewData.stats.pendingReview,
    );

    return {
      stats,
      recentCampaigns: campaigns.slice(0, 6),
      recentJobs: jobs.slice(0, 10),
      recentResults: results.slice(0, 15),
      dataMode: mode,
      firebaseConfigured: isFirebaseConfigured(),
      warning: mode === "mock" ? MOCK_MODE_WARNING : undefined,
    };
  } catch (error) {
    seedDiscoveryEngineMockDataIfEmpty();
    const campaigns = mockDiscoveryStore.listCampaigns();
    const jobs = mockDiscoveryStore.listJobs();
    const results = mockDiscoveryStore.listResults();
    return {
      stats: buildDashboardStats(campaigns, jobs, results, 0, 0),
      recentCampaigns: campaigns.slice(0, 6),
      recentJobs: jobs.slice(0, 10),
      recentResults: results.slice(0, 15),
      dataMode: "mock",
      firebaseConfigured: isFirebaseConfigured(),
      warning: getErrorMessage(error),
    };
  }
}

export async function getDiscoveryCampaignDetail(
  campaignId: string,
): Promise<DiscoveryCampaignDetailData | null> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) return null;

  const mode = await resolveDataMode();
  let jobs: DiscoveryJobDocument[];
  let results: DiscoveryResultDocument[];

  if (mode === "firestore") {
    try {
      jobs = await fetchJobsByCampaignId(campaignId);
      results = await fetchResultsByCampaignId(campaignId);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        jobs = mockDiscoveryStore.listJobsByCampaignId(campaignId);
        results = mockDiscoveryStore.listResultsByCampaignId(campaignId);
      } else {
        throw error;
      }
    }
  } else {
    jobs = mockDiscoveryStore.listJobsByCampaignId(campaignId);
    results = mockDiscoveryStore.listResultsByCampaignId(campaignId);
  }

  return {
    campaign,
    jobs,
    results,
    dataMode: mode,
    firebaseConfigured: isFirebaseConfigured(),
  };
}

export async function listDiscoveryTemplates(): Promise<DiscoveryTemplateDocument[]> {
  const mode = await resolveDataMode();
  if (mode === "firestore") {
    try {
      const templates = await fetchTemplates();
      if (templates.length > 0) return templates;
    } catch (error) {
      if (!(error instanceof FirestoreNotConfiguredError)) throw error;
    }
  }

  seedDiscoveryEngineMockDataIfEmpty();
  return mockDiscoveryStore.listTemplates();
}

export async function getDiscoveryJobListResult(
  page = 1,
  pageSize = 20,
): Promise<DiscoveryJobListResult> {
  const jobs = await listJobs();
  const total = jobs.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    jobs: jobs.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function getDiscoveryResultListResult(
  page = 1,
  pageSize = 20,
): Promise<DiscoveryResultListResult> {
  const results = await listResults();
  const total = results.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    results: results.slice(start, start + pageSize),
    total,
    page: safePage,
    pageSize,
    totalPages,
  };
}

export async function runDiscoveryCampaignJob(
  campaignId: string,
): Promise<DiscoveryJobDocument> {
  const campaign = await getCampaignById(campaignId);
  if (!campaign) {
    throw new Error("Campaign not found.");
  }

  const now = new Date().toISOString();
  const mode = await resolveDataMode();

  const jobInput = {
    campaignId: campaign.id,
    campaignName: campaign.name,
    provider: campaign.provider,
    status: "running" as const,
    progress: 0,
    totalResults: 0,
    processedResults: 0,
    importedResults: 0,
    duplicateResults: 0,
    failedResults: 0,
    importJobId: null,
    pipelineJobId: null,
    createdBy: CREATED_BY,
    createdAt: now,
    updatedAt: now,
    startedAt: now,
    completedAt: null,
    durationMs: null,
    errorMessage: null,
    metadata: { keywords: generateCampaignKeywords(campaign) },
  };

  let job: DiscoveryJobDocument;
  if (mode === "firestore") {
    try {
      job = await persistJob(jobInput);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        job = mockDiscoveryStore.createJob(jobInput);
      } else {
        throw error;
      }
    }
  } else {
    job = mockDiscoveryStore.createJob(jobInput);
  }

  const started = Date.now();

  try {
    const resultInputs = await dispatchDiscoveryProvider(campaign, job.id);

    let savedResults: DiscoveryResultDocument[];
    if (mode === "firestore") {
      try {
        savedResults = await persistResults(resultInputs);
      } catch (error) {
        if (error instanceof FirestoreNotConfiguredError) {
          savedResults = mockDiscoveryStore.createResults(resultInputs);
        } else {
          throw error;
        }
      }
    } else {
      savedResults = mockDiscoveryStore.createResults(resultInputs);
    }

    const duplicateCount = savedResults.filter((r) => r.isDuplicate).length;
    const importable = savedResults.filter((r) => !r.isDuplicate);

    let importJobId: string | null = null;
    let pipelineJobId: string | null = null;

    if (importable.length > 0) {
      const importResult = await createImportFromResults(
        campaign.name,
        campaign.provider,
        importable,
      );
      if (importResult) {
        importJobId = importResult.importJobId;
        pipelineJobId = await startPipelineForImport({
          provider: mapDiscoveryProviderToPipelineProvider(campaign.provider),
          importJobId: importResult.importJobId,
          totalRecords: importResult.recordCount,
          metadata: { discoveryCampaignId: campaign.id, discoveryJobId: job.id },
          skipExtraction: campaign.provider !== "instagram",
        });
      }
    }

    const completedAt = new Date().toISOString();
    const durationMs = Date.now() - started;

    const updated = await saveJobUpdate(job.id, {
      status: "completed",
      progress: 100,
      totalResults: savedResults.length,
      processedResults: savedResults.length,
      importedResults: importable.length,
      duplicateResults: duplicateCount,
      failedResults: 0,
      importJobId,
      pipelineJobId,
      completedAt,
      durationMs,
    });

    if (campaign.status === "draft") {
      const { updateCampaignStatus } = await import("@/lib/services/campaignService");
      await updateCampaignStatus(campaign.id, "active");
    }

    return updated ?? job;
  } catch (error) {
    await saveJobUpdate(job.id, {
      status: "failed",
      errorMessage: getErrorMessage(error),
      completedAt: new Date().toISOString(),
      durationMs: Date.now() - started,
    });
    throw error;
  }
}

export async function getDiscoveryHistoryData(): Promise<{
  jobs: DiscoveryJobDocument[];
  results: DiscoveryResultDocument[];
  dataMode: "firestore" | "mock";
  firebaseConfigured: boolean;
}> {
  const mode = await resolveDataMode();
  const [jobs, results] = await Promise.all([listJobs(), listResults()]);

  return {
    jobs: jobs.filter((j) => j.status === "completed" || j.status === "failed"),
    results,
    dataMode: mode,
    firebaseConfigured: isFirebaseConfigured(),
  };
}
