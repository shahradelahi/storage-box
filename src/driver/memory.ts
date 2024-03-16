import { JsonMap } from '@/parser';
import { IStorageDrive, Serializable } from '@/typings.ts';

export default class MemoryDriver implements IStorageDrive {
  protected _storage: Map<string, Serializable>;

  constructor(storage?: Map<string, Serializable>) {
    if (storage) {
      this._storage = JsonMap.parse(storage);
    } else {
      this._storage = new Map();
    }
  }

  get(key: string): Serializable | undefined {
    return this._storage.get(key);
  }

  set(key: string, value: Serializable): void {
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
