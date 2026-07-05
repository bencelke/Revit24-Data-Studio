import {
  collection,
  type Firestore,
  type CollectionReference,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import type { FirestoreCollectionName } from "@/lib/firebase/config";

export interface Repository<T extends DocumentData> {
  readonly collectionName: FirestoreCollectionName;
  getCollection(): CollectionReference<T> | null;
  findById(id: string): Promise<T | null>;
  findAll(constraints?: QueryConstraint[]): Promise<T[]>;
  create(data: Omit<T, "id">): Promise<string>;
  update(id: string, data: Partial<T>): Promise<void>;
  delete(id: string): Promise<void>;
}

export abstract class BaseRepository<T extends DocumentData>
  implements Repository<T>
{
  abstract readonly collectionName: FirestoreCollectionName;

  constructor(protected readonly getDb: () => Firestore | null) {}

  getCollection(): CollectionReference<T> | null {
    const db = this.getDb();
    if (!db) return null;
    return collection(db, this.collectionName) as CollectionReference<T>;
  }

  async findById(id: string): Promise<T | null> {
    void id;
    throw new Error(`${this.collectionName} repository: findById not implemented.`);
  }

  async findAll(constraints?: QueryConstraint[]): Promise<T[]> {
    void constraints;
    throw new Error(`${this.collectionName} repository: findAll not implemented.`);
  }

  async create(data: Omit<T, "id">): Promise<string> {
    void data;
    throw new Error(`${this.collectionName} repository: create not implemented.`);
  }

  async update(id: string, data: Partial<T>): Promise<void> {
    void id;
    void data;
    throw new Error(`${this.collectionName} repository: update not implemented.`);
  }

  async delete(id: string): Promise<void> {
    void id;
    throw new Error(`${this.collectionName} repository: delete not implemented.`);
  }
}
