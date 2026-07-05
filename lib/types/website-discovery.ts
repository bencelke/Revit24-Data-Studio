import type { WebsiteRawDocument } from "./websites";

export interface WebsiteDiscoveryInput {
  urls: string[];
  inputType: "single" | "bulk" | "csv" | "domain";
  respectRobotsTxt?: boolean;
}

export interface WebsiteDiscoveryResult {
  jobId: string;
  urls: string[];
  totalUrls: number;
  mockMode: boolean;
  workerAvailable: boolean;
}

export interface WebsiteExtractionInput {
  url: string;
  jobId: string;
}

export interface WebsiteExtractionResult {
  success: boolean;
  data: WebsiteRawDocument | null;
  error: string | null;
  mockMode: boolean;
}

export interface WebsiteDiscoveryProvider {
  readonly name: string;
  readonly platform: "website" | "sitemap" | "custom";
  isWorkerAvailable(): boolean;
  validateUrls(urls: string[]): { valid: string[]; invalid: string[] };
  createDiscoveryJob(input: WebsiteDiscoveryInput): Promise<WebsiteDiscoveryResult>;
}

export interface WebsiteExtractionProvider {
  readonly name: string;
  readonly version: string;
  isAvailable(): boolean;
  extract(input: WebsiteExtractionInput): Promise<WebsiteExtractionResult>;
}
