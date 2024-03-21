import type { IStorageDrive, Serializable, StorageType } from '@/typings.ts';

function getStorage(type: StorageType): Storage {
  if (typeof window === 'undefined') {
    throw new Error('This driver can only be used in the browser');
  }

  if (type === 'local') {
    return localStorage;
  } else {
    return sessionStorage;
  }
}

export default class BrowserDriver implements IStorageDrive {
  protected readonly _storage: Storage;

  constructor(type: StorageType) {
    const storage = getStorage(type);

    if (!storage) {
      throw new Error('Storage not available');
    }

    this._storage = storage;
  }

  async get(key: string): Promise<Serializable | undefined> {
    const value = this._storage.getItem(key);
    if (value === null) {
      return undefined;
    }
    return value;
  }

  async set(key: string, value: Serializable): Promise<void> {
    // If value was undefined or null we should remove the key
    if (value === undefined || value === null) {
      await this.del(key);
      return;
    }

    this._storage.setItem(key, value.toString());
  }

  async del(key: string): Promise<void> {
    this._storage.removeItem(key);
  }

  async exists(key: string): Promise<boolean> {
    return this._storage.getItem(key) !== null;
  }

  async keys(): Promise<string[]> {
    return Object.keys(this._storage);
  }

  /**
   * Clears the storage. Please be careful with this method.
   */
  async clear(): Promise<void> {
    this._storage.clear();
  }
}
