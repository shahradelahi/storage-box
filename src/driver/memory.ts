import { JsonMap, SerializableList } from '@/index.ts';
import type { IStorageDrive, Serializable } from '@/typings.ts';

export default class MemoryDriver implements IStorageDrive {
  protected _storage: Map<string, Serializable | SerializableList>;

  constructor(storage?: Map<string, Serializable>) {
    if (storage) {
      this._storage = JsonMap.parse(storage);
    } else {
      this._storage = new Map();
    }
  }

  async get(key: string) {
    return this._storage.get(key);
  }

  async set(key: string, value: Serializable) {
    this._storage.set(key, value);
  }

  async del(key: string) {
    this._storage.delete(key);
  }

  async exists(key: string) {
    return this._storage.has(key);
  }

  async keys() {
    return Array.from(this._storage.keys());
  }

  async clear() {
    this._storage.clear();
  }
}
