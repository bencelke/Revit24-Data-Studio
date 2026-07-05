import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { JobRecord } from "@/lib/types";

class JobsRepository extends BaseRepository<JobRecord> {
  readonly collectionName = FIRESTORE_COLLECTIONS.jobs;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const jobsRepository = new JobsRepository();
