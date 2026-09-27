/**
 * BaseRepository — Generic CRUD over StorageService.
 * Uses the canonical BaseRecord from src/types/index.ts.
 */

import { StorageService } from '../storage/StorageService';

export interface RepositoryRecord {
  id: string;
  createdAt: string;
  updatedAt: string;
}

/** Collision-resistant local ID: lv_<timestamp_base36>_<random> */
export function generateId(prefix = 'lv'): string {
  const ts = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 9);
  return `${prefix}_${ts}_${rand}`;
}

export class BaseRepository<T extends RepositoryRecord> {
  protected readonly namespace: string;

  constructor(namespace: string) {
    this.namespace = namespace;
  }

  protected storageKey(id: string): string {
    return `${this.namespace}:${id}`;
  }

  async findAll(): Promise<T[]> {
    const records = await StorageService.getAll<T>(this.namespace);
    return records.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  }

  async findById(id: string): Promise<T | null> {
    return StorageService.get<T>(this.storageKey(id));
  }

  async create(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const record = {
      ...data,
      id: generateId(),
      createdAt: now,
      updatedAt: now,
    } as T;
    await StorageService.set<T>(this.storageKey(record.id), record);
    return record;
  }

  async update(
    id: string,
    patch: Partial<Omit<T, 'id' | 'createdAt'>>,
  ): Promise<T | null> {
    const existing = await this.findById(id);
    if (!existing) return null;
    const updated: T = {
      ...existing,
      ...patch,
      updatedAt: new Date().toISOString(),
    };
    await StorageService.set<T>(this.storageKey(id), updated);
    return updated;
  }

  async delete(id: string): Promise<boolean> {
    const existing = await this.findById(id);
    if (!existing) return false;
    await StorageService.remove(this.storageKey(id));
    return true;
  }

  /** Insert exactly as-is — used by SeedService */
  async upsert(record: T): Promise<void> {
    await StorageService.set<T>(this.storageKey(record.id), record);
  }

  async deleteAll(): Promise<void> {
    await StorageService.clearNamespace(this.namespace);
  }

  async count(): Promise<number> {
    return (await this.findAll()).length;
  }
}
