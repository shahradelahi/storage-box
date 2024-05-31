import { HashField, HashRecord, HashValue, StorageDriver } from '@/index';

export interface MemoryDriverOptions<Key extends HashField, Value extends HashValue> {
  initialValue?: HashRecord<Key, Value>;
}

export default class MemoryDriver<
  Key extends HashField = HashField,
  Value extends HashValue = HashValue,
> implements StorageDriver<Key, Value>
{
  protected _storage: HashRecord<Key, Value> = {} as HashRecord<Key, Value>;

  constructor(options: MemoryDriverOptions<Key, Value> = {}) {
    if (options.initialValue) {
      Object.assign(this._storage, options.initialValue);
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
    this._storage[key] = value;
  }

  del(key: Key) {
    const hasKey = this.exists(key);
    if (hasKey) {
      delete this._storage[key];
    }
  }

  exists(key: Key) {
    return key in this._storage;
  }

  keys(): Key[] {
    return Object.keys(this._storage) as Key[];
  }

  values(): Value[] {
    return Object.values(this._storage);
  }

  clear() {
    this._storage = {} as HashRecord<Key, Value>;
  }
}
