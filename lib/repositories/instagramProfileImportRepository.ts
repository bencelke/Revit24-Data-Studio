/**
 * @deprecated Use lib/repositories/importJobsRepository and importRecordsRepository.
 * Thin compatibility layer for existing imports.
 */
export {
  createImportJob as createInstagramProfileImportJob,
  getImportJob as getInstagramProfileImportJob,
  listImportJobs as listInstagramProfileImportJobs,
  updateImportJob as updateInstagramProfileImportJobStatus,
} from "./importJobsRepository";

export {
  createImportRecords,
  listImportRecords as listInstagramProfileImportRecords,
  findExistingRecordsByUsernames,
} from "./importRecordsRepository";

export {
  isFirebaseConfigured,
  isFirestoreAvailable as isFirebaseConfiguredLegacy,
} from "./firestore-client";

export { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";

import {
  createImportJob,
  getImportJob,
} from "./importJobsRepository";
import { createImportRecords } from "./importRecordsRepository";
import type {
  ImportJobDocument,
  ImportRecordDocument,
} from "@/lib/types/import-jobs";

/** @deprecated Use importJobService.createImportJobFromBulkInput */
export async function createInstagramProfileImportJobBatch(
  job: Omit<ImportJobDocument, "id">,
  records: Omit<ImportRecordDocument, "id">[],
): Promise<string> {
  const created = await createImportJob(job);
  await createImportRecords(records.map((record) => ({ ...record, jobId: created.id })));
  return created.id;
}

export async function getInstagramProfileImportJobWithRecordsLegacy(
  jobId: string,
): Promise<(ImportJobDocument & { records: ImportRecordDocument[] }) | null> {
  const job = await getImportJob(jobId);
  if (!job) return null;

  const { listImportRecords } = await import("./importRecordsRepository");
  const records = await listImportRecords(jobId);
  return { ...job, records };
}
