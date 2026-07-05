import type {
  InstagramProfileImportJob,
  InstagramProfileImportRecord,
} from "@/lib/types/instagram-imports";

export interface InstagramProfileImportRepository {
  create(job: InstagramProfileImportJob): Promise<string>;
  findById(id: string): Promise<InstagramProfileImportJob | null>;
  findAll(): Promise<InstagramProfileImportJob[]>;
  addRecords(
    jobId: string,
    records: InstagramProfileImportRecord[],
  ): Promise<void>;
  update(
    id: string,
    data: Partial<InstagramProfileImportJob>,
  ): Promise<void>;
}
