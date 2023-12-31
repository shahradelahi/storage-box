import { JsonMap } from '@/parser';
import type { IStorageDrive } from '@/typings.ts';
import type { JsonValue } from 'type-fest';

export default class MemoryDrive implements IStorageDrive {
  protected _storage: Map<string, JsonValue>;

  constructor(storage?: Map<string, JsonValue>) {
    if (storage) {
      this._storage = JsonMap.parse(storage);
    } else {
      this._storage = new Map();
    }
  }

  get(key: string): JsonValue | undefined {
    return this._storage.get(key);
  }

  set(key: string, value: JsonValue): void {
    this._storage.set(key, value);
  }

  del(key: string): void {
    this._storage.delete(key);
  }

  exists(key: string): boolean {
    return this._storage.has(key);
  }

  keys(): string[] {
    return Array.from(this._storage.keys());
  }

  clear(): void {
    this._storage.clear();
  }
}
