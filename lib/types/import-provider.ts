import type { PipelineProvider } from "./pipeline";

export interface ImportProviderContext {
  pipelineJobId: string;
  importJobId?: string;
  sourceJobId?: string;
  recordIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface ImportProviderResult {
  success: boolean;
  processed: number;
  failed: number;
  message?: string;
}

export interface ImportProvider {
  readonly provider: PipelineProvider;
  readonly name: string;
  validate(context: ImportProviderContext): Promise<ImportProviderResult>;
  prepare(context: ImportProviderContext): Promise<ImportProviderResult>;
  extract(context: ImportProviderContext): Promise<ImportProviderResult>;
  normalize(context: ImportProviderContext): Promise<ImportProviderResult>;
  detectDuplicates(context: ImportProviderContext): Promise<ImportProviderResult>;
  sendToReview(context: ImportProviderContext): Promise<ImportProviderResult>;
  publish(context: ImportProviderContext): Promise<ImportProviderResult>;
}
