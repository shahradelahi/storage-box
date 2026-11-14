import { HashField, HashRecord, HashValue, StorageDriver } from '@/index';
import { defineOwn, hasOwn } from '@/utils/object';

export interface MemoryDriverOptions<Key extends HashField, Value extends HashValue> {
  initialValue?: HashRecord<Key, Value>;
}

export default class MemoryDriver<
  Key extends HashField = HashField,
  Value extends HashValue = HashValue,
> implements StorageDriver<Key, Value> {
  protected _storage: HashRecord<Key, Value> = Object.create(null) as HashRecord<Key, Value>;

  constructor(options: MemoryDriverOptions<Key, Value> = {}) {
    if (options.initialValue) {
      for (const [key, value] of Object.entries(options.initialValue)) {
        defineOwn(this._storage, key, value);
      }
    }
  }

  get(key: Key): Value | null {
    const hasKey = this.exists(key);
    if (!hasKey) {
      return null;
    }
    return this._storage[key];
  }

  set(key: Key, value: Value) {
    defineOwn(this._storage, key, value);
  }

  del(key: Key) {
    const hasKey = this.exists(key);
    if (hasKey) {
      delete this._storage[key];
    }
  }

  exists(key: Key) {
    return hasOwn(this._storage, key);
  }

  keys(): Key[] {
    return Object.keys(this._storage) as Key[];
  }

  values(): Value[] {
    return Object.values(this._storage);
  }

  clear() {
    this._storage = Object.create(null) as HashRecord<Key, Value>;
  }
}
