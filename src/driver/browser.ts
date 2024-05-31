import { HashRecord, StorageDriver } from '@/typings';

type StorageType = 'local' | 'session';

export interface BrowserDriverOptions {
  initialValue?: HashRecord<string, string>;
}

export default class BrowserDriver<Key extends string = string, Value extends string = string>
  implements StorageDriver<Key, Value>
{
  protected readonly _storage: Storage;

  constructor(type: StorageType, opts: BrowserDriverOptions = {}) {
    const { initialValue } = opts;

    if (typeof window === 'undefined') {
      throw new Error('Browser storage not available');
    }

    const storage = type === 'local' ? localStorage : sessionStorage;
    if (!storage) {
      throw new Error('Storage not available');
    }

    this._storage = storage;

    if (initialValue) {
      Object.entries(initialValue).forEach(([key, value]) => {
        this._storage.setItem(key, value.toString());
      });
    }
  }

  get(key: Key): Value | null {
    return this._storage.getItem(key) as Value | null;
  }

  set(key: Key, value: Value): void {
    // If value was undefined or null we should remove the key
    if (value === undefined || value === null) {
      return this.del(key);
    }

    this._storage.setItem(key, String(value).toString());
  }

  del(key: Key): void {
    this._storage.removeItem(key);
  }

  exists(key: Key): boolean {
    return this._storage.getItem(key) !== null;
  }

  keys(): Key[] {
    return Object.keys(this._storage) as Key[];
  }

  values(): Value[] {
    return Object.values(this._storage) as Value[];
  }

  /**
   * Clears the storage. Please be careful with this method.
   */
  clear(): void {
    this._storage.clear();
  }
}
