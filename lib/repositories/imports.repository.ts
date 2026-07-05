import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { ImportRecord } from "@/lib/types";

class ImportsRepository extends BaseRepository<ImportRecord> {
  readonly collectionName = FIRESTORE_COLLECTIONS.imports;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const importsRepository = new ImportsRepository();
