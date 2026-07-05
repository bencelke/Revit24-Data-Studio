import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { ProfileRecord } from "@/lib/types";

class ProfilesRepository extends BaseRepository<ProfileRecord> {
  readonly collectionName = FIRESTORE_COLLECTIONS.profiles;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const profilesRepository = new ProfilesRepository();
