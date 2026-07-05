import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { BusinessRecord } from "@/lib/types";

class BusinessesRepository extends BaseRepository<BusinessRecord> {
  readonly collectionName = FIRESTORE_COLLECTIONS.businesses;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const businessesRepository = new BusinessesRepository();
