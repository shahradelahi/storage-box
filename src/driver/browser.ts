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

  get(key: string): Serializable | undefined {
    const value = this._storage.getItem(key);
    if (value === null) {
      return undefined;
    }
    return value;
  }

  set(key: string, value: Serializable): void {
    // If value was undefined or null we should remove the key
    if (value === undefined || value === null) {
      this.del(key);
      return;
    }

    this._storage.setItem(key, value.toString());
  }

  del(key: string): void {
    this._storage.removeItem(key);
  }

  exists(key: string): boolean {
    return this._storage.getItem(key) !== null;
  }

  keys(): string[] {
    return Object.keys(this._storage);
  }

  /**
   * Clears the storage. Please be careful with this method.
   */
  clear(): void {
    this._storage.clear();
  }
}
