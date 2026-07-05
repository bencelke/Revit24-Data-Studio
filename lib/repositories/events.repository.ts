import { FIRESTORE_COLLECTIONS } from "@/lib/firebase/config";
import { getFirebaseFirestore } from "@/lib/firebase/firestore";
import { BaseRepository } from "./base.repository";
import type { EventRecord } from "@/lib/types";

class EventsRepository extends BaseRepository<EventRecord> {
  readonly collectionName = FIRESTORE_COLLECTIONS.events;

  constructor() {
    super(getFirebaseFirestore);
  }
}

export const eventsRepository = new EventsRepository();
