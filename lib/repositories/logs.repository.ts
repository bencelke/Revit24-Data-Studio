import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { LogRecord } from "@/lib/types";

class LogsRepository extends BaseRepository<LogRecord> {
  readonly collectionName = FIRESTORE_COLLECTIONS.logs;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const logsRepository = new LogsRepository();
