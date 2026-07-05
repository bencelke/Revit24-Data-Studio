import { mockWebsiteStore } from "@/lib/mock-data/websiteStore";
import { WEBSITE_CONFIG, isWebsiteWorkerAvailable } from "@/lib/config/websites";
import { FirestoreNotConfiguredError, MOCK_MODE_WARNING } from "@/lib/errors/app-errors";
import { isFirebaseConfigured } from "@/lib/firebase/config";
import {
  createWebsiteJob as persistWebsiteJob,
  getWebsiteJob as fetchWebsiteJob,
  listWebsiteJobs as fetchWebsiteJobs,
  updateWebsiteJob as persistUpdateWebsiteJob,
} from "@/lib/repositories/websiteJobsRepository";
import {
  upsertWebsiteRaw as persistWebsiteRaw,
  listWebsiteRawByJobId as fetchWebsiteRawByJobId,
  getWebsiteRaw as fetchWebsiteRaw,
} from "@/lib/repositories/websiteRawRepository";
import { isFirestoreAvailable } from "@/lib/repositories/firestore-client";
import type {
  WebsiteDiscoveryInput,
  WebsiteDiscoveryProvider,
  WebsiteDiscoveryResult,
} from "@/lib/types/website-discovery";
import type {
  WebsiteJobDocument,
  WebsitesHubPageData,
  WebsiteResultsPageData,
  WebsiteDetailPageData,
  WebsiteRawDocument,
  WebsiteType,
} from "@/lib/types/websites";
import { getWebsiteExtractionProvider } from "@/lib/services/websiteExtractionService";
import { findWebsiteDuplicates } from "@/lib/services/websiteDuplicateService";
import { previewNormalizedWebsite } from "@/lib/services/websiteNormalizationService";

const EMAIL_REGEX = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
const PHONE_REGEX = /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{2,4}\)?[\s.-]?)?\d{3,4}[\s.-]?\d{3,4}/g;
const CREATED_BY = "system-dev";

export function parseDomain(url: string): string {
  try {
    const parsed = new URL(url.startsWith("http") ? url : `https://${url}`);
    return parsed.hostname.replace(/^www\./, "");
  } catch {
    return url.replace(/^https?:\/\//, "").split("/")[0] ?? url;
  }
}

export function normalizeUrl(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  return `https://${trimmed}`;
}

export function validateWebsiteUrl(url: string): boolean {
  try {
    const normalized = normalizeUrl(url);
    const parsed = new URL(normalized);
    return Boolean(parsed.hostname.includes("."));
  } catch {
    return false;
  }
}

export function parseUrlList(text: string): string[] {
  return text
    .split(/[\n,;]+/)
    .map((line) => normalizeUrl(line.trim()))
    .filter((url) => validateWebsiteUrl(url));
}

export function parseCsvUrls(csv: string): string[] {
  const lines = csv.split("\n").slice(1);
  const urls: string[] = [];
  for (const line of lines) {
    const cols = line.split(",");
    for (const col of cols) {
      const url = normalizeUrl(col.trim().replace(/^"|"$/g, ""));
      if (validateWebsiteUrl(url)) urls.push(url);
    }
  }
  return [...new Set(urls)];
}

export function expandDomainUrls(domains: string[]): string[] {
  return domains.map((domain) => normalizeUrl(domain.replace(/^https?:\/\//, "")));
}

export function normalizeEmails(raw: string[]): Array<{ email: string; confidence: "high" | "medium" | "low"; source: string }> {
  const seen = new Set<string>();
  const results: Array<{ email: string; confidence: "high" | "medium" | "low"; source: string }> = [];

  for (const item of raw) {
    const matches = item.match(EMAIL_REGEX) ?? [];
    for (const match of matches) {
      const email = match.toLowerCase();
      if (seen.has(email)) continue;
      seen.add(email);
      const confidence = email.includes("info@") || email.includes("contact@") ? "high" : "medium";
      results.push({ email, confidence, source: "public_page" });
    }
  }

  return results;
}

export function normalizePhones(raw: string[]): Array<{ phone: string; confidence: "high" | "medium" | "low"; source: string }> {
  const seen = new Set<string>();
  const results: Array<{ phone: string; confidence: "high" | "medium" | "low"; source: string }> = [];

  for (const item of raw) {
    const matches = item.match(PHONE_REGEX) ?? [];
    for (const match of matches) {
      const digits = match.replace(/\D/g, "");
      if (digits.length < 8) continue;
      const phone = match.startsWith("+") ? match.trim() : `+${digits.startsWith("49") ? digits : `49${digits}`}`;
      if (seen.has(phone)) continue;
      seen.add(phone);
      results.push({ phone, confidence: "medium", source: "public_page" });
    }
  }

  return results;
}

export function detectSocialLinks(text: string, baseUrl: string): Record<string, string | null> {
  const links: Record<string, string | null> = {
    instagram: null,
    facebook: null,
    tiktok: null,
    youtube: null,
    linkedin: null,
    discord: null,
    telegram: null,
    x: null,
    pinterest: null,
    website: baseUrl,
  };

  const patterns: Record<string, RegExp> = {
    instagram: /instagram\.com\/[a-zA-Z0-9._]+/i,
    facebook: /facebook\.com\/[a-zA-Z0-9._]+/i,
    tiktok: /tiktok\.com\/@[a-zA-Z0-9._]+/i,
    youtube: /youtube\.com\/(channel|c|@)[a-zA-Z0-9._-]+/i,
    linkedin: /linkedin\.com\/(company|in)\/[a-zA-Z0-9._-]+/i,
    discord: /discord\.(gg|com)\/[a-zA-Z0-9]+/i,
    telegram: /t\.me\/[a-zA-Z0-9_]+/i,
    x: /(twitter|x)\.com\/[a-zA-Z0-9_]+/i,
    pinterest: /pinterest\.com\/[a-zA-Z0-9._]+/i,
  };

  for (const [platform, pattern] of Object.entries(patterns)) {
    const match = text.match(pattern);
    if (match) {
      links[platform] = match[0].startsWith("http") ? match[0] : `https://${match[0]}`;
    }
  }

  return links;
}

export function detectBusinessTypeFromText(text: string): WebsiteType | null {
  const haystack = text.toLowerCase();
  const rules: Array<[WebsiteType, string[]]> = [
    ["Car Club", ["car club", "owners club", "enthusiasts"]],
    ["Performance Shop", ["performance", "tuning shop"]],
    ["Detailer", ["detailing", "detailer", "ceramic"]],
    ["Wrap Shop", ["wrap shop", "vinyl wrap"]],
    ["Race Track", ["race track", "circuit", "raceway"]],
    ["Dealership", ["dealership", "dealer"]],
    ["Automotive Blog", ["blog", "magazine"]],
    ["Motorsport Organization", ["motorsport", "racing organization"]],
  ];

  for (const [type, keywords] of rules) {
    if (keywords.some((keyword) => haystack.includes(keyword))) return type;
  }

  return null;
}

async function saveJob(input: Omit<WebsiteJobDocument, "id">): Promise<WebsiteJobDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistWebsiteJob(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockWebsiteStore.createJob(input);
      throw error;
    }
  }
  return mockWebsiteStore.createJob(input);
}

async function updateJob(id: string, data: Partial<WebsiteJobDocument>): Promise<void> {
  if (isFirestoreAvailable()) {
    try {
      await persistUpdateWebsiteJob(id, data);
      return;
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        mockWebsiteStore.updateJob(id, data);
        return;
      }
      throw error;
    }
  }
  mockWebsiteStore.updateJob(id, data);
}

async function saveRaw(input: Omit<WebsiteRawDocument, "id">): Promise<WebsiteRawDocument> {
  if (isFirestoreAvailable()) {
    try {
      return await persistWebsiteRaw(input);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) return mockWebsiteStore.upsertRaw(input);
      throw error;
    }
  }
  return mockWebsiteStore.upsertRaw(input);
}

export class DefaultWebsiteDiscoveryProvider implements WebsiteDiscoveryProvider {
  readonly name = "Website URL Discovery";
  readonly platform = "website" as const;

  isWorkerAvailable(): boolean {
    return isWebsiteWorkerAvailable();
  }

  validateUrls(urls: string[]): { valid: string[]; invalid: string[] } {
    const valid: string[] = [];
    const invalid: string[] = [];
    for (const url of urls) {
      if (validateWebsiteUrl(url)) valid.push(url);
      else invalid.push(url);
    }
    return { valid, invalid };
  }

  async createDiscoveryJob(input: WebsiteDiscoveryInput): Promise<WebsiteDiscoveryResult> {
    return runWebsiteDiscoveryJob(input);
  }
}

export async function runWebsiteDiscoveryJob(
  input: WebsiteDiscoveryInput,
): Promise<WebsiteDiscoveryResult> {
  let urls = input.urls;

  if (input.inputType === "csv") {
    urls = parseCsvUrls(input.urls.join("\n"));
  } else if (input.inputType === "domain") {
    urls = expandDomainUrls(input.urls);
  } else {
    urls = input.urls.length === 1 && input.urls[0].includes("\n")
      ? parseUrlList(input.urls[0])
      : input.urls.flatMap((item) => parseUrlList(item));
  }

  const limited = urls.slice(0, WEBSITE_CONFIG.maxUrlsPerJob);
  const timestamp = new Date().toISOString();
  const workerAvailable = isWebsiteWorkerAvailable();

  const job = await saveJob({
    status: "running",
    inputType: input.inputType,
    urls: limited,
    createdBy: CREATED_BY,
    createdAt: timestamp,
    startedAt: timestamp,
    completedAt: null,
    totalUrls: limited.length,
    processedUrls: 0,
    successfulUrls: 0,
    failedUrls: 0,
    respectRobotsTxt: input.respectRobotsTxt ?? WEBSITE_CONFIG.respectRobotsTxt,
  });

  const provider = getWebsiteExtractionProvider();
  let processed = 0;
  let successful = 0;
  let failed = 0;

  for (const url of limited) {
    const result = await provider.extract({ url, jobId: job.id });
    processed += 1;

    if (result.success && result.data) {
      const { id, ...rawData } = result.data;
      void id;
      await saveRaw({ ...rawData, jobId: job.id });
      successful += 1;
    } else {
      failed += 1;
    }

    await updateJob(job.id, { processedUrls: processed, successfulUrls: successful, failedUrls: failed });
  }

  const completedAt = new Date().toISOString();
  await updateJob(job.id, {
    status: failed === limited.length ? "failed" : "completed",
    completedAt,
    processedUrls: processed,
    successfulUrls: successful,
    failedUrls: failed,
  });

  return {
    jobId: job.id,
    urls: limited,
    totalUrls: limited.length,
    mockMode: !workerAvailable,
    workerAvailable,
  };
}

export function parseWebsiteInput(text: string, inputType: WebsiteDiscoveryInput["inputType"]): string[] {
  if (inputType === "csv") return parseCsvUrls(text);
  if (inputType === "domain") return expandDomainUrls(parseUrlList(text));
  return parseUrlList(text);
}

export async function getWebsitesHubPageData(): Promise<WebsitesHubPageData> {
  const firebaseConfigured = isFirebaseConfigured();
  const useFirestore = isFirestoreAvailable();
  const workerAvailable = isWebsiteWorkerAvailable();

  let jobs: WebsiteJobDocument[];
  if (useFirestore) {
    try {
      jobs = await fetchWebsiteJobs();
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) jobs = mockWebsiteStore.listJobs();
      else throw error;
    }
  } else {
    jobs = mockWebsiteStore.listJobs();
  }

  return {
    jobs,
    dataMode: useFirestore ? "firestore" : "mock",
    firebaseConfigured,
    workerAvailable,
    warning: workerAvailable
      ? useFirestore ? undefined : MOCK_MODE_WARNING
      : "Worker Not Running — using Mock Mode for public metadata extraction.",
  };
}

export async function getWebsiteResultsPageData(jobId: string): Promise<WebsiteResultsPageData | null> {
  const hub = await getWebsitesHubPageData();
  let job: WebsiteJobDocument | null;
  let websites: WebsiteRawDocument[];

  if (isFirestoreAvailable()) {
    try {
      job = await fetchWebsiteJob(jobId);
      websites = job ? await fetchWebsiteRawByJobId(jobId) : [];
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) {
        job = mockWebsiteStore.getJob(jobId);
        websites = job ? mockWebsiteStore.listRawByJobId(jobId) : [];
      } else throw error;
    }
  } else {
    job = mockWebsiteStore.getJob(jobId);
    websites = job ? mockWebsiteStore.listRawByJobId(jobId) : [];
  }

  if (!job) return null;

  return { job, websites, dataMode: hub.dataMode, firebaseConfigured: hub.firebaseConfigured, workerAvailable: hub.workerAvailable };
}

export async function getWebsiteDetailPageData(id: string): Promise<WebsiteDetailPageData | null> {
  const hub = await getWebsitesHubPageData();
  let website: WebsiteRawDocument | null;

  if (isFirestoreAvailable()) {
    try {
      website = await fetchWebsiteRaw(id);
    } catch (error) {
      if (error instanceof FirestoreNotConfiguredError) website = mockWebsiteStore.getRaw(id);
      else throw error;
    }
  } else {
    website = mockWebsiteStore.getRaw(id);
  }

  if (!website) return null;

  return {
    website,
    duplicates: await findWebsiteDuplicates(website),
    normalizationPreview: previewNormalizedWebsite(website),
    dataMode: hub.dataMode,
    firebaseConfigured: hub.firebaseConfigured,
    workerAvailable: hub.workerAvailable,
  };
}

export const defaultWebsiteDiscoveryProvider = new DefaultWebsiteDiscoveryProvider();

export async function createWebsiteDiscoveryJob(input: WebsiteDiscoveryInput): Promise<WebsiteDiscoveryResult> {
  return defaultWebsiteDiscoveryProvider.createDiscoveryJob(input);
}
