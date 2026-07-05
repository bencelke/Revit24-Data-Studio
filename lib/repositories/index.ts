export { BaseRepository } from "./base.repository";
export type { Repository } from "./base.repository";
export { importsRepository } from "./imports.repository";
export { profilesRepository } from "./profiles.repository";
export { businessesRepository } from "./businesses.repository";
export { eventsRepository } from "./events.repository";
export { usersRepository } from "./users.repository";
export { logsRepository } from "./logs.repository";
export { jobsRepository } from "./jobs.repository";
export type { ImportRepository } from "./importRepository";

export {
  createImportJob,
  updateImportJob,
  deleteImportJob,
  getImportJob,
  listImportJobs,
} from "./importJobsRepository";

export {
  createImportRecords,
  getImportRecord,
  listAllImportRecords,
  listImportRecords,
  updateImportRecord,
  deleteImportRecord,
  countImportRecords,
  findExistingRecordsByUsernames,
  deleteImportRecordsByJobId,
} from "./importRecordsRepository";

export {
  createApprovedRecord,
  getApprovedRecord,
  getApprovedRecordByImportRecordId,
  listApprovedRecords,
} from "./approvedRecordsRepository";

export {
  createReviewHistoryEntry,
  listReviewHistoryByRecordId,
  listRecentReviewHistory,
} from "./reviewHistoryRepository";

export {
  createExtractionJob,
  getExtractionJob,
  listExtractionJobs,
  updateExtractionJob,
  getExtractionJobsByImportJobId,
} from "./extractionJobsRepository";

export {
  createExtractionRecords,
  listExtractionRecords,
  listAllExtractionRecords,
} from "./extractionRecordsRepository";

export { createWorkerLog, listWorkerLogs } from "./workerLogsRepository";

export { createAppLog, listRecentAppLogs } from "./appLogsRepository";

export {
  getFirestoreDb,
  isFirestoreAvailable,
  isFirebaseConfigured,
} from "./firestore-client";

export { FirestoreNotConfiguredError } from "@/lib/errors/app-errors";
