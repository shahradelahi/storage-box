import { HashRecord, StorageDriver } from '@/typings';

type StorageType = 'local' | 'session';

function getStorage(type: StorageType): Storage {
  if (typeof window === 'undefined') {
    throw new Error('Browser storage not available');
  }

  return type === 'local' ? localStorage : sessionStorage;
}

export interface BrowserDriverOptions {
  initialValue?: HashRecord<string, string>;
}

export default class BrowserDriver<Key extends string = string, Value extends string = string>
  implements StorageDriver<Key, Value>
{
  protected readonly _storage: Storage;

  constructor(type: StorageType, opts: BrowserDriverOptions = {}) {
    const { initialValue } = opts;

    const storage = getStorage(type);
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

  async get(key: Key): Promise<Value | null> {
    return this._storage.getItem(key) as Value | null;
  }

  async set(key: Key, value: Value): Promise<void> {
    // If value was undefined or null we should remove the key
    if (value === undefined || value === null) {
      return this.del(key);
    }

    this._storage.setItem(key, String(value).toString());
  }

  async del(key: Key): Promise<void> {
    this._storage.removeItem(key);
  }

  async exists(key: Key): Promise<boolean> {
    return this._storage.getItem(key) !== null;
  }

  async keys(): Promise<Key[]> {
    return Object.keys(this._storage) as Key[];
  }

  async values(): Promise<Value[]> {
    return Object.values(this._storage) as Value[];
  }

  /**
   * Clears the storage. Please be careful with this method.
   */
  async clear(): Promise<void> {
    this._storage.clear();
  }
}
