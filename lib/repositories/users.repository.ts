import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { AppUser } from "@/lib/types";

class UsersRepository extends BaseRepository<AppUser> {
  readonly collectionName = FIRESTORE_COLLECTIONS.users;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const usersRepository = new UsersRepository();
