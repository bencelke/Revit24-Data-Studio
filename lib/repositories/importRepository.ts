import type {
  ImportFilterParams,
  ImportJob,
  ImportListResult,
  ImportSummary,
} from "@/lib/types/imports";

export interface ImportRepository {
  findAll(params?: ImportFilterParams): Promise<ImportListResult>;
  findById(id: string): Promise<ImportJob | null>;
  getSummary(): Promise<ImportSummary>;
  create(job: Omit<ImportJob, "id">): Promise<string>;
  update(id: string, job: Partial<ImportJob>): Promise<void>;
  delete(id: string): Promise<void>;
}
